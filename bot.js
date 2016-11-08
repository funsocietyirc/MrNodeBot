/** MrNodeBot IRC Bot By IronY */
'use strict';

// Extend the max socket listeners
process.setMaxListeners(0);

// Node Libs
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const storage = require('node-persist');
const HashMap = require('hashmap');

// Project libs
const helpers = require('./helpers');
const conLogger = require('./lib/consoleLogger');
const scheduler = require('./lib/scheduler');
const randomString = require('./lib/randomString');

// Extend for project
require('./extensions');
// Extend For Un-cache
require('./lib/uncache')(require);

// Dynamic collections
const dynCollections = _([
    'AdmCallbacks', // Administrative commands
    'NickChanges', // Fired On Nick changes
    'Registered', // Fired on Server Register
    'Listeners', // Fired when messages are received
    'WebRoutes', // Express JS Web routes
    'Commands', // IRC Trigger commands
    'Stats', // Basic usage stats
    'OnJoin', // Fired when user joins channel
    'OnKick', // Fired when user is kicked from channel
    'OnPart', // Fired when user parts channel
    'OnQuit', // Fired when user quites network
    'OnTopic', // Fired when topic is changed
    'OnConnected', // Fired when Connection to IRC is established
]);

class MrNodeBot {
    constructor(callback, configPath) {
        // Assign and normalize callback
        this._callback = _.isFunction(callback) ? callback : false;

        // Configuration Object
        this.Config = require(configPath || './config');
        this.Config.irc.autoConnect = false;

        // Set Script Directories
        this._scriptDirectories = this.Config.bot.scripts;

        // Grab twitter client
        this._twitterClient = require('./lib/twitterClient');

        // Grab the IRC instance
        this._ircClient = require('./lib/ircClient');

        // Dynamically create Collections
        dynCollections.each(v => this[v] = new HashMap());

        // Lists
        this.Ignore = [];
        this.Admins = [];
        this.LoadedScripts = [];

        // Track root path
        this.AppRoot = require('app-root-path').toString();

        // Class Variables that are initialized elsewhere
        this.Database = null;
        this.Webserver = null;

        // Init Chain
        this._initDbSubSystem();
        this._initWebServer();
        this._initIrc();
        this._initStorageSubSystem();
        this._initUserManager();
    };

    // Init the Web Server
    _initWebServer() {
        conLogger('Starting Web Server...', 'info');
        this.WebServer = require('./web/server')(this);
        conLogger(`Web Server started on port ${this.Config.express.port}`, 'success');
    };

    // Init the IRC Bot
    _initIrc() {
        conLogger('Connecting to IRC', 'info');
        // Connect the Bot to the irc network
        return new Promise((resolve, reject) => this._ircClient.connect(20, () => {
                conLogger(`Connected to ${this.Config.irc.server} as ${this._ircClient.nick}`, 'success');
                resolve();
            }))
            // If there is a password and we are on the same nick we were configured for, identify
            .then(() => {
                if (!this.Config.nickserv.password || this.Config.irc.nick != this._ircClient.nick) return;
                let first = this.Config.nickserv.host ? `@${this.Config.nickserv.host}` : '';
                let nickserv = `${this.Config.nickserv.nick}${first}`;
                this._ircClient.say(nickserv, `identify ${this.Config.nickserv.password}`);
            })
            // Load in the scripts
            .then(() => this._loadDynamicAssets(false))
            // Initialize the listeners
            .then(() => {
                conLogger('Initializing Listeners', 'info');
                _({
                        // Handle On First Line recieved from IRC Client
                        'registered': message => this._handleRegistered(message),
                        // Handle Channel Messages
                        'message#': (from, to, text, message) => this._handleCommands(from, to, text, message),
                        // Handle Private Messages
                        pm: (from, text, message) => this._handleCommands(from, from, text, message),
                        // Handle Notices, also used to check validation for NickServ requests
                        notice: (from, text, message) => this._handleAuthenticatedCommands(from, text, message),
                        // Handle CTCP Requests
                        ctcp: (from, to, text, type, message) => this._handleCtcpCommands(from, to, text, message),
                        // Handle Nick changes
                        nick: (oldnick, newnick, channels, message) => this._handleNickChanges(oldnick, newnick, channels, message),
                        // Handle Joins
                        join: (channel, nick, message) => this._handleOnJoin(channel, nick, message),
                        // Handle On Parts
                        part: (channel, nick, reason, message) => this._handleOnPart(channel, nick, reason, message),
                        // Handle On Kick
                        kick: (channel, nick, by, reason, message) => this._handleOnKick(channel, nick, by, reason, message),
                        // Handle On Quit
                        quit: (nick, reason, channels, message) => this._handleOnQuit(nick, reason, channels, message),
                        // Handle Topic changes
                        topic: (channel, topic, nick, message) => this._handleOnTopic(channel, topic, nick, message),
                        // Catch all to prevent drop on error
                        error: message => {}
                    })
                    // Add the listeners to the IRC Client
                    .each((value, key) => this._ircClient.addListener(key, value));
            })
            // Run The On Connected events
            .then(() => this.OnConnected.forEach(x => {
                try {
                    x.call();
                } catch (e) {
                    conLogger(e, 'error');
                }
            }))
            // Run The callback
            .then(() => {
                if (this._callback) this._callback(this);
            });
    };

    // Init the Database subsystem
    _initDbSubSystem() {
        // We have a Database available
        if (this.Config.knex.enabled) {
            conLogger('Initializing Database Sub System', 'info');
            this.Database = require('./database/client');
            conLogger('Database Sub System Initialized', 'success');
            return;
        }

        // We haave no Database available
        conLogger('No Database system found, features limited', 'error');
        this.Database = false;
    };

    // Initialize the user manager
    _initUserManager() {
        if (!this.Database) {
            conLogger('Database not present, UserManager disabled');
            return;
        }

        let UserManager = require('./lib/userManager');
        this._userManager = new UserManager();
    };

    //noinspection JSMethodCanBeStatic
    _clearCache(fullPath) {
        require.uncache(require.resolve(fullPath));
    };

    // Extensions Loader
    // Read all JS files in the scripts directory and evaluate them
    // During the update process this updates the script portions of the code
    _loadScriptsFromDir(dir, clearCache) {
        let normalizedPath = path.join(__dirname, dir);

        conLogger(`Loading all scripts from ${dir}`, 'loading');

        // Require In the scripts
        // Load all files with .js extension
        _(fs.readdirSync(normalizedPath))
            .each(file => {
                // Attempt to see if the module is already loaded
                let fullPath = `${normalizedPath}${path.sep}${file}`;
                // Attempt to Load the module
                try {
                    // Clear the chache if specified
                    if (clearCache === true && !_.endsWith(file, 'Store.js')) {
                        this._clearCache(fullPath);
                    }
                    // If we are not dealing with a partial file _something.js
                    if (file[0] != '_' && _.endsWith(file, '.js')) {
                        conLogger(`Loading Script: ${file} `, 'success');
                        this.LoadedScripts.push({
                            fullPath: fullPath,
                            info: require(`./${dir}/${file}`)(this)
                        });
                    }
                } catch (err) {
                    conLogger(`[${err}] in: ${fullPath}`.replace(`${path.sep}${path.sep}`, `${path.sep}`), 'error');
                }
            });
    };

    // Init storage
    _initStorageSubSystem() {
        // Load the storage before the Bot connects (Sync)
        storage.initSync();

        // Load the Ignore list
        storage.getItem('ignored', (err, value) => {
            this.Ignore = value || this.Ignore;
            conLogger(`Total Ignored: ${this.Ignore.length}`, 'info');
        });

        // Load the Admin list
        storage.getItem('admins', (err, value) => {
            if (value) {
                this.Admins = value;
            }
            // Default to owner nick if no admin list exists
            else {
                this.Admins = [_.toLower(this.Config.owner.nick)];
                storage.setItemSync('admins', this.Admins);
            }
            conLogger(`Total Administrators: ${this.Admins.length}`, 'info');
        });

        conLogger('Application State Initialized', 'success');
    };

    // Read the configuration and alias any commands specified
    _createCommandAliases() {
        // Read in command rebindings
        if (!this.Config.commandBindings || !_.isArray(this.Config.commandBindings)) return;

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
                conLogger(`The alias ${commandBinding.alias} for the command ${commandBinding.command} already exists`, 'error');
                return;
            }
            this.Commands.set(commandBinding.alias, this.Commands.get(commandBinding.command));
        });
    };



    _loadDynamicAssets(clearCache = false) {
        // Clear dynamic assets
        if (clearCache) {
            // Clear all existing jobs
            scheduler.clear();
            // Clear Dynamic Collections
            dynCollections.each(v => this[v].clear());
        }

        // Load in the Scripts
        if (!this.Config.bot.disableScripts) {
            this._scriptDirectories.forEach(script => {
                this._loadScriptsFromDir(script, true);
            });
            // Assign command aliases
            this._createCommandAliases();
        }

        // Load the web routes
        this.WebRoutes.forEach(route => {
            // Dynamically register the WebRoutes objects with express
            this.WebServer[route.verb || 'get'](route.path, route.name, route.handler);
        });
    };

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
    };

    // Handle Nick changes
    _handleNickChanges(oldnick, newnick, channels, message) {
        // track if the bots nick was changed
        if (oldnick === this._ircClient.nick) {
            this._ircClient.nick = newnick;
        }

        // Run events
        this.NickChanges.forEach((value, key) => {
            try {
                value.call(oldnick, newnick, channels, message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Handle On Joins
    _handleOnJoin(channel, nick, message) {
        this.OnJoin.forEach((value, key) => {
            try {
                value.call(channel, nick, message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Handle On Part
    _handleOnPart(channel, nick, reason, message) {
        this.OnPart.forEach((value, key) => {
            try {
                value.call(channel, nick, reason, message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Handle On Kick
    _handleOnKick(channel, nick, by, reason, message) {
        this.OnKick.forEach((value, key) => {
            try {
                value.call(channel, nick, by, reason, message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Handle On Quit
    _handleOnQuit(nick, reason, channels, message) {
        this.OnQuit.forEach((value, key) => {
            try {
                value.call(nick, reason, channels, message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Handle Topic changes
    _handleOnTopic(channel, topic, nick, message) {
        this.OnTopic.forEach((value, key) => {
            try {
                value.call(channel, topic, nick, message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Fired when the bot connects to the network
    _handleRegistered(message) {
        this.Registered.forEach((value, key) => {
            try {
                value.call(message);
            } catch (e) {
                conLogger(e, 'error');
            }
        });
    };

    // Process the commands
    _handleCommands(from, to, text, message) {
        // Build the is object to pass along to the command router
        let is = {
            ignored: _.includes(this.Ignore, _.toLower(from)),
            self: from === this._ircClient.nick,
            privateMsg: to === from
        };

        // Format the text, extract the command, and remove the trigger / command to send to handler
        let textArray = text.split(' '),
            cmd = is.privateMsg ? textArray[0] : textArray[1];
        textArray.splice(0, is.privateMsg ? 1 : 2);
        let output = textArray.join(' ');

        // Check on trigger for private messages
        is.triggered = (is.privateMsg && this.Commands.has(cmd) ? true : (text.startsWith(this._ircClient.nick) && this.Commands.has(cmd)));

        // Process the listeners
        if (!is.triggered && !is.ignored && !is.self) {
            this.Listeners.forEach((value, key) => {
                try {
                    value.call(to, from, text, message, is);
                } catch (e) {
                    conLogger(e, 'error');
                }
            });
        }

        // If triggered, not ignored, and not a self message
        if (is.triggered && !is.ignored && !is.self) {
            // Check if the command exists
            if (this.Commands.has(cmd)) {
                // Make sure its not admin only
                if (this.Commands.get(cmd).access === this.Config.accessLevels.guest) {
                    // Record Stats
                    this.Stats.set(cmd, this.Stats.has(cmd) ? this.Stats.get(cmd) + 1 : 1);
                    // Run the callback, give it the text array without the command
                    this.Commands.get(cmd).call(to, from, output, message, is);
                } else {
                    this.AdmCallbacks.set(from, {
                        cmd: cmd,
                        from: from,
                        to: to,
                        text: text,
                        message: message,
                        is: is
                    });
                    // Send a check to nickserv to see if the user is registered
                    // Will spawn the notice listener to do the rest of the work
                    let first = this.Config.nickserv.host ? `@${this.Config.nickserv.host}` : '';
                    this.say(`${this.Config.nickserv.nick}${first}`, `acc ${from}`);
                }
            }
        }
    };

    //noinspection JSMethodCanBeStatic
    _handleAuthenticatedCommands(nick, to, text, message) {
        if (_.toLower(nick) === _.toLower(this.Config.nickserv.nick)) {
            let [user, acc, code] = text.split(' ');
            if (this.AdmCallbacks.has(user)) {
                let admCall = this.AdmCallbacks.get(user),
                    admCmd = this.Commands.get(admCall.cmd),
                    admTextArray = admCall.text.split(' ');

                // Check if the user is identified, pass it along in the is object
                admCall.is.identified = code == this.Config.nickserv.accCode;

                // Clean the output
                admTextArray.splice(0, admCall.to === admCall.from ? 1 : 2);
                let output = admTextArray.join(' ');

                // Is Identified
                if (admCall.is.identified) {
                    let admFromLower = _.toLower(admCall.from);
                    let unauthorized =
                        (admCmd.access == this.Config.accessLevels.owner && admFromLower !== _.toLower(this.Config.owner.nick)) ||
                        (admCmd.access === this.Config.accessLevels.admin && !_.includes(this.Admins, admFromLower));

                    // Log to the console if a user without access a command they are not privy too
                    if (unauthorized) {
                        let group = helpers.AccessString(admCall.access);
                        this.say(admCall.from, `You are not a member of the ${group} access list.`);
                        conLogger(`${admCall.from} on ${admCall.to} tried to use the ${group} command ${admCall.cmd}`, 'error');
                        return;
                    }

                    try {
                        this.Commands.get(admCall.cmd).call(admCall.to, admCall.from, output, admCall.message, admCall.is);
                    } catch (e) {
                        conLogger(e, 'error');
                    }
                }
                // Is not identified
                else {
                    this.say(admCall.from, 'You must be identified with NickServ to use this command');
                }

                // Remove the callback from the stack
                this.AdmCallbacks.remove(user);
            }
        }
    };

    // Handle CTCP commands
    // TODO handle ACL on ctcp commands
    _handleCtcpCommands(from, to, text, type, message) {
        let textArray = text.split(' ');
        return;
    };

    // Send a message to the target
    say(target, message) {
        this._ircClient.say(target, randomString(message));
    };

    // Send a action to the target
    action(target, message) {
        this._ircClient.action(target, randomString(message));
    };

    // Send notice to the target
    notice(target, message) {
        this._ircClient.notice(target, randomString(message));
    };

    // Check if user is in channel
    isInChannel(channel, nick) {
        return this._ircClient.isInChannel(channel, nick);
    };

    // Reload the configruation
    reloadConfiguration() {
        this._clearCache('./config.js');
        this.Config = require('./config.js');
        // Assure AutoConnect flag is not reset
        this.Config.irc.autoConnect = false;
    };


    // Properties

    // Bots IRC Nickname
    get nick() {
        return this._ircClient.nick;
    };
    set nick(newNick) {
        // If we do not have a provided nick, use the settings default
        newNick = newNick || this.Config.irc.nick;
        this._ircClient.send('nick', newNick);
        this._ircClient.nick = newNick;
    };

    // Bots IRC Channels
    get channels() {
        return _(this._ircClient.chans).keys().uniq().value();
    };

    // Getting to allow quick setting of channels
    set channels(value) {
        // Given an array
        if (_.isArray(value)) value.forEach(channel => {
            if (!this.isInChannel(channel)) {
                this._ircClient.join(channel);
            }
        });
        // Given a string
        else if (_.isString(value)) {
            value.split(' ').forEach(channel => {
                if (!this.isInChannel(channel)) {
                    this._ircClient.join(channel);
                }
            });
        }
    };

}

// Export Class
module.exports = MrNodeBot;
