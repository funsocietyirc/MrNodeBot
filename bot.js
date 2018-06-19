/**
 * @module bot
 * @author IronY
 */

// Node Libs
const _ = require('lodash');
const c = require('irc-colors');
const fs = require('fs');
const path = require('path');
const storage = require('node-persist');

// Project libs
const logger = require('./lib/logger');
const scheduler = require('./lib/scheduler');
const preprocessText = require('./lib/preprocessText');
const t = require('./lib/localize');
const IrcWrappers = require('./lib/ircWrappers');

const clearModule = require('clear-module');

/** Dynamically created collections */
const dynCollections = _([
    'AdmCallbacks', // Administrative commands
    'NickChanges', // Fired On Nick changes
    'Registered', // Fired on Server Register
    'Listeners', // Fired when messages are received
    'WebRoutes', // Express JS Web routes
    'Commands', // IRC Trigger commands
    'Stats', // Basic usage stats
    'OnAction', // Action Listeners
    'OnJoin', // Fired when user joins channel
    'OnKick', // Fired when user is kicked from channel
    'OnPart', // Fired when user parts channel
    'OnQuit', // Fired when user quites network
    'OnTopic', // Fired when topic is changed
    'OnConnected', // Fired when Connection to IRC is established
    'OnNotice', // Fired when a notice is received
    'OnCtcp', // Fired when a ctcp is received
]);

/**
 * MrNodeBot primary class
 * @param {function} [callback] A callback to fire after registering with the server
 * @param {string} [configPath=config.js] a full path to a configuration file
 */
class MrNodeBot {
    constructor(callback, configPath) {
        // Assign and normalize callback
        this._callback = _.isFunction(callback) ? callback : false;

        /** Configuration Object */
        const currentConfigPath = configPath || './config';
        this.Config = require(currentConfigPath);
        // Fail-safe to prevent against auto-connect
        this.Config.irc.autoConnect = false;

        /** Script Directories */
        this._scriptDirectories = this.Config.bot.scripts;

        /** Twitter Client Instance */
        this._twitterClient = require('./lib/twitterClient');

        /** Irc Client Instance */
        this._ircClient = require('./lib/ircClient');

        // Dynamically create Collections
        dynCollections.each((v) => {
            this[v] = new Map();
        });

        /** Ignore List */
        this.Ignore = [];
        /** Admin list */
        this.Admins = [];

        // Initialize local storage
        this._initStorageSubSystem().then(() => {
            /** Loaded Scripts */
            this.LoadedScripts = [];

            /** Application Root Path */
            this.AppRoot = require('app-root-path').toString();

            /** Database Instance */
            this.Database = null;
            this._initDbSubSystem();

            /** Web Server Instance */
            this.WebServer = null;
            this._initWebServer();

            /** User Manager */
            this._userManager = null;
            this._initUserManager();

            /** Irc Client Instance */
            this._ircClient = require('./lib/ircClient');
            this._ircWrappers = null;
            this._initIrc();
        });
    }

    /**
     * Log Errors
     * @param message
     * @param err
     * @private
     */
    _errorHandler(message, err) {
        logger.error(message, {
            err: err.message || '',
            stack: err.stack || '',
        });
    }

    /**
     * Initialize Web Server
     * @private
     */
    _initWebServer() {
        logger.info(t('webServer.starting'));
        this.WebServer = require('./web/server')(this);

        logger.info(t('webServer.started', {
            port: this.Config.express.port,
        }));

        // Initialize the SocketIO service
        this._initSocketIO();
    }

    /**
     * Initialize SocketIO
     * @private
     */
    _initSocketIO() {
        logger.info(`SocketIO is now bound to the Express instance running on ${this.Config.express.port}`);

        // Socket IO Master connection event
        this.WebServer.socketIO.on('connection', (sock) => {
            // Logging is turned off, bail
            if (!_.isObject(this.Config.socketIO) || !this.Config.socketIO.logging) return;
            // Log Connection
            logger.info('Socket IO Connection Established');
            // Log Message
            sock.on('message', msg => logger.info(`Socket IO Message: ${msg}`));
            // Log Disconnect
            sock.on('disconnect', msg => logger.info('Socket IO Disconnection'));
            // Log Error
            sock.on('error', err => this._errorHandler('Socket.IO Error', err));
        });
    }

    /**
     * Connect to the IRC server
     * @returns {Promise}
     * @private
     */
    async _connectToIrc() {
        return new Promise((resolve, reject) => this._ircClient.connect(20, () => {
            logger.info(t('irc.connected', {
                server: this.Config.irc.server,
                nick: this.nick,
            }));
            resolve();
        }));
    }

    /**
     * Initialize IRC
     * @returns {Promise.<void>}
     * @private
     */
    async _initIrc() {
        try {
            await this._connectToIrc();
        } catch (err) {
            this._errorHandler('Something went wrong calling the _connectToIrc method', err);
        }

        const first = this.Config.nickserv.host ? `@${this.Config.nickserv.host}` : '';
        const nickserv = `${this.Config.nickserv.nick}${first}`;

        this._ircClient.say(nickserv, `identify ${this.Config.nickserv.password}`);

        try {
            await this._loadDynamicAssets(false);
        } catch (err) {
            this._errorHandler('Something went wrong calling the _loadDynamicAssets method', err);
        }

        this._ircWrappers = new IrcWrappers(this);

        logger.info(t('listeners.init'));
        _({
            // Handle OnAction
            action: (nick, to, text, message) => this._ircWrappers.handleAction(nick, to, text, message),
            // Handle On First Line received from IRC Client
            registered: message => this._ircWrappers.handleRegistered(message),
            // Handle Channel Messages
            'message#': (nick, to, text, message) => this._ircWrappers.handleCommands(nick, to, text, message),
            // Handle Private Messages
            pm: (nick, text, message) => this._ircWrappers.handleCommands(nick, nick, text, message),
            // Handle Notices, also used to check validation for NickServ requests
            notice: (nick, to, text, message) => {
                // Check for auth command, return if we have one
                if (_.toLower(nick) === _.toLower(this.Config.nickserv.nick)) this._ircWrappers.handleAuthenticatedCommands(nick, to, text, message);
                else this._ircWrappers.handleOnNotice(nick, to, text, message);
            },
            // Handle CTCP Requests
            ctcp: (nick, to, text, type, message) => this._ircWrappers.handleCtcpCommands(nick, to, text, type, message),
            // Handle Nick changes
            nick: (oldNick, newNick, channels, message) => this._ircWrappers.handleNickChanges(oldNick, newNick, channels, message),
            // Handle Joins
            join: (channel, nick, message) => this._ircWrappers.handleOnJoin(channel, nick, message),
            // Handle On Parts
            part: (channel, nick, reason, message) => this._ircWrappers.handleOnPart(channel, nick, reason, message),
            // Handle On Kick
            kick: (channel, nick, by, reason, message) => this._ircWrappers.handleOnKick(channel, nick, by, reason, message),
            // Handle On Quit
            quit: (nick, reason, channels, message) => this._ircWrappers.handleOnQuit(nick, reason, channels, message),
            // Handle Topic changes
            topic: (channel, topic, nick, message) => this._ircWrappers.handleOnTopic(channel, topic, nick, message),
            // Catch Network Errors
            netError: (exception) => {
                logger.error('Something went wrong in the IRC Client network connection', exception);
            },
            abort: (retryCount) => {
                logger.error(`Lost Connection to server, retrying (attempt ${retryCount})`);
            },
            // Catch all to prevent drop on error
            error: (message) => {
                if (message.args.length && message.args[0].startsWith('Closing Link:')) {
                    logger.info(message.args[0]);
                    return;
                }
                logger.error('Uncaught IRC Client error', {
                    message,
                });
            },
        }).each((value, key) => this._ircClient.addListener(key, value));

        this.OnConnected.forEach(async (x) => {
            try {
                await x.call();
            } catch (err) {
                this._errorHandler('Error in onConnected', err);
            }
        });

        if (_.isFunction(this._callback)) this._callback(this);
    }

    /**
     * Initialize Database Subsystem
     * @private
     */
    _initDbSubSystem() {
        // We have a Database available
        if (this.Config.knex.enabled) {
            logger.info(t('database.initializing'));
            this.Database = require('./database/client');
            logger.info(t('database.initialized'));
            return;
        }

        // We have no Database available
        logger.error(t('database.missing', {
            feature: 'Database Core',
        }));

        this.Database = false;
    }

    /**
     * Initialize User Manager
     * @private
     */
    _initUserManager() {
        if (!this.Database) {
            logger.info(t('database.missing', {
                feature: 'User Manager',
            }));
            return;
        }

        const UserManager = require('./lib/userManager');
        this._userManager = new UserManager();
    }

    /**
     * Clear file from Node cache
     * @param {string} fullPath Path to cached file
     */
    static _clearCache(fullPath) {
        clearModule(require.resolve(fullPath));
    }

    /**
     * Extension Loader
     * @description Read all JS files in the script directories and require them.
     * @param {string} dir Directory to load scripts from
     * @param {boolean} [clearCache] - Should the files be cleared from the node cache
     */
    _loadScriptsFromDir(dir, clearCache) {
        logger.info(t('scripts.initializing', {
            dir,
        }));
        // Get a normalized path to the script
        const normalizedPath = path.join(__dirname, dir);

        /**
         * require a script
         * @param {string} file
         */
        const requireScript = (file) => {
            // Attempt to see if the module is already loaded
            const fullPath = `${normalizedPath}${path.sep}${file}`;
            // Attempt to Load the module
            try {
                // Clear the cache if specified, ignore files that end with Store.js
                if (clearCache === true && !_.endsWith(file, 'Store.js')) {
                    MrNodeBot._clearCache(fullPath);
                }
                // If we are not dealing with a partial file _something.js
                if (file[0] !== '_' && _.endsWith(file, '.js')) {
                    logger.info(t('scripts.loaded', {
                        file,
                    }));

                    const scriptInfo = {
                        fullPath,
                        info: require(`./${dir}/${file}`)(this),
                    };

                    // If we have a name field, run it through a start case filter
                    if (scriptInfo.info.name) scriptInfo.info.name = _.startCase(scriptInfo.info.name);
                    this.LoadedScripts.push(scriptInfo);

                    // If we have a on command, call it
                    if (_.isFunction(scriptInfo.info.onLoad)) {
                        logger.info(`Running onLoad command for ${scriptInfo.info.name || file}`);
                        scriptInfo.info.onLoad.call();
                    }
                }
            } catch (err) {
                this._errorHandler(t('scripts.error', {
                    path: fullPath,
                }), err);
            }
        };

        // Load all files with .js extension
        _(fs.readdirSync(normalizedPath)).each(requireScript);
    }

    /**
     * Initialize Locale Storage subsystem
     * @private
     */
    async _initStorageSubSystem() {
       await storage.init();
       try {
            const tmpIgnore = await storage.getItem('ignored');
            this.Ignore = tmpIgnore || this.Ignore;
            const tmpAdmins = await storage.getItem('admins');
            if(tmpAdmins) {
                this.Admins = tmpAdmins;
            } else {
                this.Admins = [_.toLower(this.Config.owner.nick)];
                await storage.setItem('admins', this.Admins);
            }
       }
       catch (err) {
           logger.error('Error Loading the Persisted Assets'); // TODO Localize
           return;
       }
        logger.info(t('storage.initialized'));
    }

    /**
     * Read the configuration and alias any commands specified
     * @private
     */
    _createCommandAliases() {
        // Read in command rebinding
        if (!this.Config.commandBindings || !_.isArray(this.Config.commandBindings)) return;

        this.Config.commandBindings.forEach((commandBinding) => {
            if (!commandBinding.alias || !commandBinding.command) {
                logger.error(t('aliases.improperStructure'));
                return;
            }
            if (!this.Commands.has(commandBinding.command)) {
                logger.error(t('aliases.doesNotExist', {
                    alias: commandBinding.command,
                    command: commandBinding.alias,
                }));
                return;
            }

            if (this.Commands.has(commandBinding.alias)) {
                logger.error(t('aliases.alreadyExists', {
                    alias: commandBinding.command,
                    command: commandBinding.alias,
                }));
                return;
            }
            this.Commands.set(commandBinding.alias, this.Commands.get(commandBinding.command));
        });
    }

    /**
     * Reload all dynamic assets
     * @param {boolean} [clearCache=false] Should the assets also be un-cached
     */
    _loadDynamicAssets(clearCache = false) {
        // Clear dynamic assets
        if (clearCache) {
            // Clear all existing jobs
            scheduler.clear();

            // Unload the scripts
            this.LoadedScripts.filter(x => _.isFunction(x.info.onUnload)).forEach((x) => {
                logger.info(`Running onUnload for ${x.info.name || x.fullPath}`);
                x.info.onUnload.call();
            });

            // Clear Dynamic Collections
            dynCollections.each(v => this[v].clear());

            // Clear Loaded Scripts
            this.LoadedScripts = [];
        }

        // Load in the Scripts
        if (!this.Config.bot.disableScripts) {
            this._scriptDirectories.forEach((script) => {
                this._loadScriptsFromDir(script, clearCache);
            });
            // Normalize all command keys to be lowercase
            for (const [key, value] of this.Commands.entries()) {
                const lowercaseKey = key.toLowerCase();
                if (key !== lowercaseKey) {
                    logger.info(`Switching ${key} command to lowercase ${lowercaseKey}`);
                    this.Commands.set(lowercaseKey, value);
                    this.Commands.delete(key);
                }
            }
            // Assign command aliases
            this._createCommandAliases();
        }

        // Load the web routes
        this.WebRoutes.forEach((route, name) => {
            // We have a secure route, add it to the proper namespace
            if (_.isBoolean(route.secure) && route.secure) {
                // Remove any leading /
                if (_.startsWith(route.path, '/')) route.path = route.path.substring(1);
                route.path = `/secure/${route.path}`;
            }
            // Dynamically register the WebRoutes objects with express
            this.WebServer[route.verb || 'get'](route.path, name, route.handler);
        });
    }

    /**
     *  Bootstrap the Bot, by either killing the process or reloading dynamic assets
     * @param {boolean} [hard=false] Should We terminate the process
     */
    Bootstrap(hard = false) {
        if (hard) {
            logger.info(t('bootstrap.rebooting'));
            this._ircClient.disconnect();
            process.exit();
        } else {
            logger.info(t('bootstrap.reloading'));
            this._loadDynamicAssets(true);
        }
    }

    /**
     * Logger for action / say/ notice
     * @param {string} ircMsg Nick / Channel to say it to
     * @param {string} target
     * @param {string} translationKey Translation Key
     */
    static _logInfo(ircMsg, target, translationKey) {
        const normalizedMessage = c.stripColorsAndStyle(ircMsg);
        if (normalizedMessage === ircMsg) {
            logger.info(t(translationKey, {
                target,
                message: normalizedMessage,
            }));
        } else {
            logger.info(t(translationKey, {
                target,
                message: normalizedMessage,
            }), {
                original: ircMsg,
            });
        }
    }

    /**
     * IRC message response
     * @param {string} target
     * @param {string} message
     * @param {string} type
     * @param {string} translationKey
     * @param {function} processor
     * @private
     */
    _ircResponse(target, message, type, translationKey, processor) {
        if (!_.isString(message) || _.isEmpty(message.trim())) return;
        const msg = preprocessText(message, processor);
        MrNodeBot._logInfo(msg, target, translationKey);
        this._ircClient[type](target, msg);
    }


    /**
     * Say something over IRC
     * @param {string} target Nick / Channel to say it to
     * @param {string} message What to say
     * @param {function} processor
     */
    say(target, message, processor) {
        this._ircResponse(target, message, 'say', 'events.sentMessage', processor);
    }

    /**
     * Perform an Action over IRC
     * @param {string} target Nick / Channel to say it to
     * @param {string} message What to say
     * @param {function} processor
     */
    action(target, message, processor) {
        this._ircResponse(target, message, 'action', 'events.sentAction', processor);
    }

    /**
     * Perform a Notice over IRC
     * @param {string} target Nick / Channel to say it to
     * @param {string} message What to say
     * @param {function} processor
     */
    notice(target, message, processor) {
        this._ircResponse(target, message, 'notice', 'events.sentNotice', processor);
    }

    /**
     * Reload Bots Configuration Object
     */
    reloadConfiguration() {
        logger.info(t('bootstrap.reloadConfig'));

        MrNodeBot._clearCache('./config.js');
        this.Config = require('./config.js');
        // Assure AutoConnect flag is not reset
        this.Config.irc.autoConnect = false;
    }

    // Properties

    /**
     * Bots IRC Nickname
     * @returns {string}
     */
    get nick() {
        return this._ircClient.nick;
    }

    /**
     * Bots IRC Nickname
     * @param {string} newNick
     */
    set nick(newNick) {
        // If we do not have a provided nick, use the settings default
        newNick = newNick || this.Config.irc.nick;
        logger.info(t('events.nickChanged', {
            oldNick: this.nick,
            newNick,
        }));
        this._ircClient.send('nick', newNick);
        this._ircClient.nick = newNick;
        this._ircClient.originalNick = newNick;
    }

    /**
     * Get IRC Channels
     * @returns {array}
     */
    get channels() {
        return _(this._ircClient.chans).keys().uniq().value();
    }

    /**
     *
     * @param {array} value
     */
    set channels(value) {
        // Given an array
        if (_.isArray(value)) {
            value.forEach((channel) => {
                if (!this._ircClient.isInChannel(channel)) {
                    this._ircClient.join(channel);
                }
            });
        }
        // Given a string
        else if (_.isString(value)) {
            value.split(' ').forEach((channel) => {
                if (!this._ircClient.isInChannel(channel)) {
                    this._ircClient.join(channel);
                }
            });
        }
    }
}

/** Expose the Bot */
module.exports = MrNodeBot;
