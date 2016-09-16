/** MrNodeBot IRC Bot By IronY */
'use strict';

const HashMap = require('hashmap');
const storage = require('node-persist');
const fs = require("fs");
const helpers = require('./helpers');
const conLogger = require('./lib/consoleLogger');
const RandomString = require('./lib/randomString');

// Load in overrides
require('./extensions');

// Extend For Un-cache
require('./lib/uncache')(require);

class MrNodeBot {
    constructor(callback, configPath) {
        // Assign and normalize callback
        this._callback = callback instanceof Function ? callback : false;

        // Configuration Object
        this.Config = require(configPath || './config');

        // Set Script Directories
        this._scriptDirectories = this.Config.bot.scripts;

        // Grab the IRC instance
        this._ircClient = require('./lib/ircclient');

        // A list of collections used
        this.AdmCallbacks = new HashMap();
        this.NickChanges = new HashMap();
        this.Registered = new HashMap();
        this.Listeners = new HashMap();
        this.WebRoutes = new HashMap();
        this.Commands = new HashMap();
        this.Stats = new HashMap();
        this.OnJoin = new HashMap();
        this.OnTopic = new HashMap();

        // Lists
        this.Ignore = [];
        this.Admins = [];

        // Assign scheduler
        this.Scheduler = require('node-schedule');

        // Track root path
        this.AppRoot = require('app-root-path').toString();

        // Init the Database subsystem
        this._initDbSubSystem();

        // // Init the Web server
        this._initWebServer();
        //
        // // Init irc
        this._initIrc();

        // Init storage
        this._initStorageSubSystem();

        // Setup the app
        this._initRandomSubSystem();

        // Initialize the user manager
        this._initUserManager();

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
        this._ircClient.connect(20, () => {
            conLogger(`Connected to ${this.Config.irc.server} as ${this._ircClient.nick}`, 'success');

            // If there is a password and we are on the same nick we were configured for, identify
            if (this.Config.nickserv.password && this.Config.irc.nick == this._ircClient.nick) {
                let first = this.Config.nickserv.host ? `@${this.Config.nickserv.host}` : '';
                let nickserv = `${this.Config.nickserv.nick}${first}`;
                this._ircClient.say(nickserv, `identify ${this.Config.nickserv.password}`);
            }

            this._loadDynamicAssets();

            // Run The callback
            if (this._callback) {
                this._callback(this);
            }
        });
    }

    _initDbSubSystem() {
        if (this.Config.knex.enabled) {
            conLogger('Initializing Database Sub System', 'info');
            this.Database = require('./lib/orm');
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
        this._ircClient.addListener('registered', () => {
            this._handleRegistered(self);
        });

        // Handle Channel Messages
        this._ircClient.addListener('message#', (from, to, text, message) => {
            this._handleCommands(self, from, to, text, message);
        });

        // Handle Private Messages
        this._ircClient.addListener('pm', (from, text, message) => {
            this._handleCommands(self, from, from, text, message);
        });

        // Handle Notices, also used to check validation for NickServ requests
        this._ircClient.addListener('notice', (from, text, message) => {
            this._handleAuthenticatedCommands(self, from, text, message);
        });

        // Handle CTCP Requests
        this._ircClient.addListener('ctcp', (from, to, text, type, message) => {
            this._handleCtcpCommands(self, from, to, text, message);
        });

        // Handle Nick changes
        this._ircClient.addListener('nick', (oldnick, newnick, channels, message) => {
            this._handleNickChanges(self, oldnick, newnick, channels, message);
        });

        // Handle On Joins
        this._ircClient.addListener('join', (channel, nick, message) => {
            this._handleOnJoin(self, channel, nick, message);
        });

        // Handle Topic changes
        this._ircClient.addListener('topic', (channel, topic, nick, message) => {
            this._handleOnTopic(self, channel, topic, nick, message);
        });

        // Catch all to prevent drop on error
        this._ircClient.addListener('error', message => {
            // This can now be turned on by setting showErrors in the bot configuration
        });

        conLogger('Listeners Initialized', 'success');
    }

    _initUserManager() {
        if (!this.Database) {
            conLogger('Database not present, UserManager disabled');
            return;
        }

        let UserManager = require('./lib/userManager');
        this._userManager = new UserManager();
    }

    //noinspection JSMethodCanBeStatic
    _clearCache(fullPath) {
        require.uncache(require.resolve(fullPath));
    }

    // Extensions Loader
    // Read all JS files in the scripts directory and evaluate them
    // During the update process this updates the script portions of the code
    _loadScriptsFromDir(dir) {
        let path = require('path');
        let normalizedPath = path.join(__dirname, dir);

        conLogger(`Loading all scripts from ${dir}`, 'loading');

        // Require In the scripts
        fs.readdirSync(normalizedPath).forEach(file => {
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
            // Reload the Configuration
            this._clearCache('./config.js');
            this.Config = require('./config.js');

            this.AdmCallbacks.clear();
            this.NickChanges.clear();
            this.Registered.clear();
            this.Listeners.clear();
            this.WebRoutes.clear();
            this.Commands.clear();
            this.Stats.clear();
            this.OnJoin.clear();
            this.OnTopic.clear();
        }

        // Load in the Scripts
        if (!this.Config.bot.disableScripts) {
            this._scriptDirectories.forEach(script => {
                this._loadScriptsFromDir(script);
            });

            // Read in command rebindings
            if (this.Config.commandBindings && this.Config.commandBindings.constructor === Array) {
                this.Config.commandBindings.forEach(commandBinding => {
                    if (!commandBinding.alias || !commandBinding.command) {
                        conLogger(`Improper structure in config.js for commandBindings`, 'error');
                        return;
                    }
                    if (!this.Commands.has(commandBinding.command)) {
                        conLogger(`The command ${commandBinding.command} for alias ${commandBinding.alias} does not exist`, 'error');
                        return;
                    }
                    if (this.Commands.has(commandBinding.alias)) {
                        conLogger(`The alias ${commandBinding.alias} for the command ${commandBinding.command} already exists`,'error');
                        return;
                    }
                    this.Commands.set(commandBinding.alias, this.Commands.get(commandBinding.command));
                });
            }
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
            this._ircClient.disconnect();
            process.exit();
        } else {
            conLogger('Reloading...', 'info');
            this._loadDynamicAssets(true);
        }
    }

    // Handle Nick changes
    _handleNickChanges(app, oldnick, newnick, channels, message) {
        // track if the bots nick was changed
        if (oldnick === this._ircClient.nick) {
            this._ircClient.nick = newnick;
        }
        // Run events
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
            value.call(app);
        });
    }

    // Process the commands
    _handleCommands(app, from, to, text, message) {
        // Build the is object to pass along to the command router
        let is = {
            ignored: app.Ignore.contains(from.toLowerCase()),
            self: from === app._ircClient.nick,
            privateMsg: to === from
        };

        // Format the text, extract the command, and remove the trigger / command to send to handler
        let textArray = text.split(' '),
            cmd = is.privateMsg ? textArray[0] : textArray[1];
        textArray.splice(0, is.privateMsg ? 1 : 2);
        let output = textArray.join(' ');

        // Check on trigger for private messages
        is.triggered = (is.privateMsg && app.Commands.has(cmd) ? true : (text.startsWith(app._ircClient.nick) && app.Commands.has(cmd)));

        // Process the listeners
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
                    app.say(`${app.Config.nickserv.nick}${first}`, `acc ${from}`);
                }
            }
        }
    }

    //noinspection JSMethodCanBeStatic
    _handleAuthenticatedCommands(app, nick, to, text, message) {
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
                        app.say(admCall.from, 'Failed Administrative command attempt logged');
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
                    app.say(admCall.from, 'You must be identified with nickserv to use this command');
                }

                // Remove the callback from the stack
                app.AdmCallbacks.remove(user);
            }
        }
    }

    // Handle CTCP commands
    //noinspection JSMethodCanBeStatic
    _handleCtcpCommands(app, from, to, text, type, message) {
            let textArray = text.split(' ');
            return;
        }
        // Run through random parser
    _filterMessage(message) {
            return RandomString(this.random, this.randomEngine, message);
        }
        // Send a message to the target
    say(target, message) {
            this._ircClient.say(target, this._filterMessage(message));
        }
        // Send a action to the target
    action(target, message) {
            this._ircClient.action(target, this._filterMessage(message));
        }
        // Send notice to the target
    notice(target, message) {
        this._ircClient.notice(target, this._filterMessage(message));
    }

    // Properties
    get nick() {
        return this._ircClient.nick;
    }
    set nick(newNick) {
        newNick = newNick || this.Config.irc.nick;
        this._ircClient.send('nick', newNick);
        this._ircClient.nick = newNick;
    }
}

module.exports = callback => new MrNodeBot(callback);
