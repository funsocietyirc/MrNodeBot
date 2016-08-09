/** MrNodeBot IRC Bot By IronY */
'use strict';

const HashMap = require('hashmap');
const storage = require('node-persist');
const helpers = require('./helpers');

const conLogger = require('./lib/consoleLogger');

// Load in overrides
require('./extensions');

// Extend For Uncacheing
require('./lib/uncache')(require);

class MrNodeBot {
    constructor(callback) {
        // Assign and normalize callback
        this._callback = callback instanceof Function ? callback : false;

        // Configuration Object
        this.Config = require('./config');

        // Set Script Directories
        this._scriptDirectories = this.Config.bot.scripts;

        // Set Model location
        this._modelDirectories = this.Config.bot.models;

        // Grab the IRC instance
        this.Bot = require('./lib/bot');

        // A list of collections used
        this._collections = ['AdmCallbacks', 'NickChanges', 'Registered', 'Listeners', 'WebRoutes', 'Commands', 'Models', 'Stats', 'OnJoin', 'OnTopic'];

        // Initalize collections
        this._collections.forEach(item => {
            eval(`this.${item} = new HashMap();`);
        });

        // Lists
        this.Ignore = [];
        this.Admins = [];

        // Assign scheduler
        this.Scheduler = require('node-schedule');

        // Track root path
        this.AppRoot = require('app-root-path').toString();

        // // Init the Web server
        this._initWebServer();
        //
        // // Init irc
        this._initIrc();

        // Init the Database subsystem
        this._initDbSubSystem();

        // Init storage
        this._initStorageSubSystem();

        // Setup the app
        this._initRandomSubSystem();

        // Add the listeners
        this._initListeners();
    }

    _initWebServer() {
        conLogger('Starting Web Server...', 'info');
        this.WebServer = require('./lib/webServer')(this);
        conLogger(`Web Server started on port ${this.Config.express.port}`, 'success');
    }

    _initIrc() {
        conLogger('Connecting to IRC', 'info');
        // Connect the Bot to the irc network
        this.Bot.connect(20, () => {
            conLogger(`Connected to ${this.Config.irc.server} as ${this.Bot.nick}`, 'success');

            // If there is a password and we are on the same nick we were configured for, identify
            if (this.Config.nickserv.password && this.Config.irc.nick == this.Bot.nick) {
                let first = this.Config.nickserv.host ? `@${this.Config.nickserv.host}` : '';
                let nickserv = `${this.Config.nickserv.nick}${first}`;
                this.Bot.say(nickserv, `identify ${this.Config.nickserv.password}`);
            }

            this._loadDynamicAssets();

            // Run The callback
            if (this._callback) {
                this._callback(this);
            };
        });
    }

    _initDbSubSystem() {
        if (this.Config.knex.enabled) {
            conLogger('Initializing Database Sub System', 'info');
            this.Database = require('./lib/orm');

            // Update database to latest migration
            this.Database.knex.migrate.latest();

            conLogger('Database Sub System Initialized', 'success');
        } else {
            conLogger('No Database system found, features limited', 'error');
            this.Database = false;
        }
    }

    _initListeners() {
        conLogger('Initializing Listeners', 'info');

        // There is no place like home
        let self = this;

        // Handle On Connect
        this.Bot.addListener('registered', () => {
            this._handleRegistered(self);
        });

        // Handle Channel Messages
        this.Bot.addListener('message#', (from, to, text, message) => {
            this._handleCommands(self, from, to, text, message);
        });

        // Handle Private Messages
        this.Bot.addListener('pm', (from, text, message) => {
            this._handleCommands(self, from, from, text, message);
        });

        // Handle Notices, also used to check validation for NickServ requests
        this.Bot.addListener('notice', (from, text, message) => {
            this._handleAuthedCommands(self, from, text, message);
        });

        // Handle CTCP Requests
        this.Bot.addListener('ctcp', (from, to, text, type, message) => {
            this._handleCtcpCommands(self, from, to, text, message);
        });

        // Handle Nick changes
        this.Bot.addListener('nick', (oldnick, newnick, channels, message) => {
            this._handleNickChanges(self, oldnick, newnick, channels, message);
        });

        // Handle On Joins
        this.Bot.addListener('join', (channel, nick, message) => {
            this._handleOnJoin(self, channel, nick, message);
        });

        // Handle Topic changes
        this.Bot.addListener('topic', (channel, topic, nick, message) => {
            this._handleOnTopic(self, channel, topic, nick, message);
        });

        // Catch all to prevent drop on error
        this.Bot.addListener('error', message => {
            // This can now be turned on by setting showErrors in the bot configuration
        });

        conLogger('Listeners Initialized', 'success');
    }

    _clearCache(fullPath) {
        require.uncache(require.resolve(fullPath));
    }

    // Models Loader
    _loadModelsFromDir(dir) {
        let path = require('path');
        let normalizedPath = path.join(__dirname, dir);
        let self = this;

        // TODO Move to foreach (comment)
        conLogger(`Loading all Models from ${dir}`, 'loading');

        require("fs").readdirSync(normalizedPath).forEach(file => {
            // Attempt to see if the module is already loaded
            let fullPath = `${normalizedPath}${path.sep}${file}`;

            // Attempt to Load the module
            try {
                self._clearCache(fullPath);

                conLogger(`Loading Model: ${file} `, 'success');

                let modPath = `./${dir}/${file}`;
                let mod = require(modPath);

                if (!this.Models.has(mod.modelName)) {
                    let model = mod.model(this);
                    this.Models.set(mod.modelName, model);
                }

            } catch (err) {
                conLogger(`[${err}] in: ${fullPath}`.replace(`${path.sep}${path.sep}`, `${path.sep}`), 'error');
            }
        });
    }

    // Extensions Loader
    // Read all JS files in the scripts directory and evaluate them
    // During the update process this updates the script portions of the code
    _loadScriptsFromDir(dir) {
        let path = require('path');
        let normalizedPath = path.join(__dirname, dir);

        conLogger(`Loading all scripts from ${dir}`, 'loading');

        require("fs").readdirSync(normalizedPath).forEach(file => {
            // Attempt to see if the module is already loaded
            let fullPath = `${normalizedPath}${path.sep}${file}`;

            // Attempt to Load the module
            try {
                this._clearCache(fullPath);
                conLogger(`Loading Script: ${file} `, 'success');
                require(`./${dir}/${file}`)(this);
            } catch (err) {
                conLogger(`[${err}] in: ${fullPath}`.replace(`${path.sep}${path.sep}`, `${path.sep}`), 'error');
            }
        });
    }

    // Application Setup
    _initRandomSubSystem() {
        conLogger('Initializing Application State', 'info');

        // Bring in random-js
        this.random = require('random-js');
        // Init Random seed
        this.randomEngine = this.random.engines.mt19937();

        // Auto Seed the random engine
        this.randomEngine.autoSeed();
    }

    // Node Persist storage
    _initStorageSubSystem() {
        // Load the storage before the Bot connects (Sync)
        storage.initSync();

        // Load the Ignore list
        storage.getItem('ignored', (err, value) => {
            this.Ignore = value || this.Ignore;
        });

        conLogger(`Total Ignored: ${this.Ignore.length}`, 'info');

        // Load the Admin list
        storage.getItem('admins', (err, value) => {
            if (value) {
                this.Admins = value;
            }
            // Default to owner nick if no admin list exists
            else {
                this.Admins = [String(this.Config.owner.nick).toLocaleLowerCase()];
                storage.setItemSync('admins', this.Admins);
            }
            conLogger(`Total Administrators: ${this.Admins.length}`, 'info');
        });

        conLogger('Application State Initialized', 'success');
    }

    _loadDynamicAssets(clearCache) {
        // Clear dynamic assets
        if (clearCache || false) {
            // Clear the HashMaps
            this._collections.forEach(item => {
                eval(`this.${item}.clear();`);
            });

        }

        // Load in the models
        this._modelDirectories.forEach(model => {
            this._loadModelsFromDir(model);
        });

        // Load in the Scripts
        if (!this.Config.disableScripts) {
            this._scriptDirectories.forEach(script => {
                this._loadScriptsFromDir(script);
            });
        }

        // Load the web routes
        this.WebRoutes.forEach(route => {
            // Dynamically register the WebRoutes objects with express
            this.WebServer[route.verb || 'get'](route.path, route.name, route.handler);
        });
    }

    // Application Bootstrap
    Bootstrap(hard) {
        hard = hard || false;
        if (hard) {
            conLogger('Rebooting...', 'info');
            this.Bot.disconnect();
            process.exit();
        } else {
            conLogger('Reloading...', 'info');
            this._loadDynamicAssets(true);
        }
    }

    // Handle Nick changes
    _handleNickChanges(app, oldnick, newnick, channels, message) {
        app.NickChanges.forEach((value, key) => {
            value.call(oldnick, newnick, channels, message);
        });
    }

    // Handle On Joins
    _handleOnJoin(app, channel, nick, message) {
        app.OnJoin.forEach((value, key) => {
            value.call(channel, nick, message);
        });
    }

    // Handle Topic changes
    _handleOnTopic(app, channel, topic, nick, message) {
        app.OnTopic.forEach((value, key) => {
            value.call(channel, topic, nick, message);
        });
    }

    // Fired when the bot connects to the network
    _handleRegistered(app) {
        app.Registered.forEach((value, key) => {
            value.call();
        });
    }

    // Process the commands
    _handleCommands(app, from, to, text, message) {
        // Build the is object to pass along to the command router
        let is = {
            ignored: app.Ignore.contains(from.toLowerCase()),
            self: from === app.Bot.nick,
            privMsg: to === from
        };

        // Format the text, extract the command, and remove the trigger / command to send to handler
        let textArray = text.split(' '),
            cmd = is.privMsg ? textArray[0] : textArray[1];
        textArray.splice(0, is.privMsg ? 1 : 2);
        let output = textArray.join(' ');

        // Check on trigger for priv messages
        is.triggered = (is.privMsg && app.Commands.has(cmd) ? true : (text.startsWith(app.Bot.nick) && app.Commands.has(cmd)));

        // Proc the listeners
        if (!is.triggered && !is.ignored && !is.self) {
            app.Listeners.forEach((value, key) => {
                value.call(to, from, text, message, is);
            });
        }

        // If triggered, not ignored, and not a self message
        if (is.triggered && !is.ignored && !is.self) {
            // Check if the command exists
            if (app.Commands.has(cmd)) {
                // Make sure its not admin only
                if (app.Commands.get(cmd).access === app.Config.accessLevels.guest) {
                    // Record Stats
                    app.Stats.set(cmd, app.Stats.has(cmd) ? app.Stats.get(cmd) + 1 : 1);
                    // Run the callback, give it the text array without the command
                    app.Commands.get(cmd).call(to, from, output, message, is);
                } else {
                    app.AdmCallbacks.set(from, {
                        cmd: cmd,
                        from: from,
                        to: to,
                        text: text,
                        message: message,
                        is: is
                    });
                    // Send a check to nickserv to see if the user is registered
                    // Will spawn the notice listener to do the rest of the work
                    let first = app.Config.nickserv.host ? `@${app.Config.nickserv.host}` : '';
                    app.Bot.say(`${app.Config.nickserv.nick}${first}`, `acc ${from}`);
                }
            }
        }
    }

    _handleAuthedCommands(app, nick, to, text, message) {
        if (String(nick).toLowerCase() === String(app.Config.nickserv.nick).toLowerCase()) {
            let textArray = text.split(' '),
                user = textArray[0],
                acc = textArray[1],
                code = textArray[2];

            // Halt function if things do not check out
            if (!user || !acc || !code || acc !== 'ACC') return;

            // If the user has an admin callback on the queue
            if (app.AdmCallbacks.has(user)) {
                let admCall = app.AdmCallbacks.get(user),
                    admCmd = app.Commands.get(admCall.cmd),
                    admTextArray = admCall.text.split(' ');

                // Check if the user is identified, pass it along in the is object
                admCall.is.identified = code == app.Config.nickserv.accCode;

                // Clean the output
                admTextArray.splice(0, admCall.to === admCall.from ? 1 : 2);
                let output = admTextArray.join(' ');

                // Is Identified
                if (admCall.is.identified) {
                    // Determined if the function call should be made
                    let call =
                        (admCmd.access === app.Config.accessLevels.identified) ||
                        (admCmd.access === app.Config.accessLevels.admin && app.Admins.contains(String(admCall.from).toLowerCase())) ||
                        (admCmd.access === app.Config.accessLevels.owner);

                    let unauthorized =
                        (admCmd.access == app.Config.accessLevels.owner && admCall.from !== app.Config.owner.nick) || (admCmd.access === app.Config.accessLevels.admin && !app.Admins.contains(String(admCall.from).toLowerCase()));

                    // Alert user of failed administrative command attempts
                    if (admCmd.access === app.Config.accessLevels.admin && !app.Admins.contains(String(admCall.from).toLowerCase())) {
                        app.Bot.say(admCall.from, 'Failed Administrative command attempt logged');
                    }

                    // Log to the console if a user without access a command they are not privy too
                    if (unauthorized) {
                        conLogger(`${admCall.from} on ${admCall.to} tried to use the ${admCmd.access} command ${admCall.cmd}`, 'error');
                    }

                    if (call) {
                        app.Commands.get(admCall.cmd).call(admCall.to, admCall.from, output, admCall.message, admCall.is);
                    }
                }
                // Is not identified
                else {
                    app.Bot.say(admCall.from, 'You must be identified with NickServ to use this command');
                }

                // Remove the callback from the stack
                app.AdmCallbacks.remove(user);
            }
        }
    }

    // Handle CTCP commands
    _handleCtcpCommands(app, from, to, text, type, message) {
        let textArray = text.split(' ');

        // Return on no command
        if (!textArray[0]) {
            return;
        }
    }

}

module.exports = callback => new MrNodeBot(callback);
