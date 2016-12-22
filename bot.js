'use strict';

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
const helpers = require('./helpers');
const logger = require('./lib/logger');
const scheduler = require('./lib/scheduler');
const randomString = require('./lib/randomString');
const t = require('./lib/localize');

// Extend For Un-cache
require('./lib/uncache')(require);

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
        this.Config = require(configPath || './config');
        // Failsafe to prevent against autoconnect
        this.Config.irc.autoConnect = false;

        /** Script Directories */
        this._scriptDirectories = this.Config.bot.scripts;

        /** Twitter Client Instance */
        this._twitterClient = require('./lib/twitterClient');

        /** Irc Client Instance */
        this._ircClient = require('./lib/ircClient');

        // Dynamically create Collections
        dynCollections.each(v => this[v] = new Map());

        /** Ignore List */
        this.Ignore = [];
        /** Admin list */
        this.Admins = [];
        // Initialize local storage
        this._initStorageSubSystem();

        /** Loaded Scripts */
        this.LoadedScripts = [];

        /** Application Root Path */
        this.AppRoot = require('app-root-path').toString();

        /** Database Instance */
        this.Database = null;
        this._initDbSubSystem();

        /** Web Server Instance */
        this.Webserver = null;
        this._initWebServer();

        /** User Manager */
        this._userManager = null;
        this._initUserManager();

        /** Irc Client Instance */
        this._ircClient = require('./lib/ircClient');
        this._initIrc();
    };

    /** Initalize Web Server */
    _initWebServer() {
        logger.info(t('webServer.starting'));
        this.WebServer = require('./web/server')(this);
        logger.info(t('webServer.started', {
            port: this.Config.express.port
        }));
    };

    /**
     * Initialize IRC client
     */
    _initIrc() {
        logger.info(t('irc.initializing'));
        // Connect the Bot to the irc network
        return new Promise((resolve, reject) => this._ircClient.connect(20, () => {
                logger.info(t('irc.connected', {
                    server: this.Config.irc.server,
                    nick: this.nick
                }));
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
                logger.info(t('listeners.init'));
                _({
                        // Handle OnAction
                        action: (nick, to, text, message) => this._handleAction(nick, to, text, message),
                        // Handle On First Line recieved from IRC Client
                        'registered': message => this._handleRegistered(message),
                        // Handle Channel Messages
                        'message#': (nick, to, text, message) => this._handleCommands(nick, to, text, message),
                        // Handle Private Messages
                        pm: (nick, text, message) => this._handleCommands(nick, nick, text, message),
                        // Handle Notices, also used to check validation for NickServ requests
                        notice: (nick, to, text, message) => {
                            // Check for auth command, return if we have one
                            if (_.toLower(nick) === _.toLower(this.Config.nickserv.nick)) this._handleAuthenticatedCommands(nick, to, text, message);
                            else this._handleOnNotice(nick, to, text, message);
                        },
                        // Handle CTCP Requests
                        ctcp: (nick, to, text, type, message) => this._handleCtcpCommands(nick, to, text, type, message),
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
                } catch (err) {
                    logger.error('Error in onConnected', {
                        err
                    });
                }
            }))
            // Run The callback
            .then(() => {
                if (this._callback) this._callback(this);
            });
    };

    /** Initialize Databse Subsystem */
    _initDbSubSystem() {
        // We have a Database available
        if (this.Config.knex.enabled) {
            logger.info(t('database.initializing'));
            this.Database = require('./database/client');
            logger.info(t('database.initialized'));
            return;
        }

        // We haave no Database available
        logger.error(t('database.missing', {
            feature: 'Database Core'
        }));
        this.Database = false;
    };

    /** Initialize User Manager */
    _initUserManager() {
        if (!this.Database) {
            logger.info(t('database.missing', {
                feature: 'User Manager'
            }));
            return;
        }

        let UserManager = require('./lib/userManager');
        this._userManager = new UserManager();
    };

    /**
     * Clear file from Node cache
     * @param {string} fullPath Path to cached file
     */
    _clearCache(fullPath) {
        require.uncache(require.resolve(fullPath));
    };

    /**
     * Extension Loader
     * @description Read all JS files in the script diectories and require them.
     * @param {string} dir Directory to load scripts from
     * @param {bool} [clearCache] - Should the files be cleared from the node cache
     */
    _loadScriptsFromDir(dir, clearCache) {
        logger.info(t('scripts.initializing', {
            dir
        }));
        // Get a normalized path to the script
        let normalizedPath = path.join(__dirname, dir);

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
                        logger.info(t('scripts.loaded', {
                            file
                        }));
                        let scriptInfo = {
                            fullPath: fullPath,
                            info: require(`./${dir}/${file}`)(this)
                        };
                        // If we have a name field, run it through a start case filter
                        if (scriptInfo.info.name) scriptInfo.info.name = _.startCase(scriptInfo.info.name);
                        this.LoadedScripts.push(scriptInfo);
                    }
                } catch (err) {
                    logger.error(t('scripts.error', {
                        path: fullPath
                    }), {
                        err
                    });
                }
            });
    };

    /** Initialize Locale Storage subsystem*/
    _initStorageSubSystem() {
        // Load the storage before the Bot connects (Sync)
        storage.initSync();

        // Load the Ignore list
        storage.getItem('ignored', (err, value) => {
            if(err) {
              logger.error('Error Loading the Ignore List'); // TODO Localize
              return;
            }
            this.Ignore = value || this.Ignore;
            logger.info(t('storage.ignored', {
                total: this.Ignore.length
            }));
        });

        // Load the Admin list
        storage.getItem('admins', (err, value) => {
            if (value) this.Admins = value;
            // Default to owner nick if no admin list exists
            else {
                this.Admins = [_.toLower(this.Config.owner.nick)];
                storage.setItemSync('admins', this.Admins);
            }
            logger.info(t('storage.admins', {
                total: this.Admins.length
            }));
        });
        logger.info(t('storage.initialized'));
    };

    /** Read the configuration and alias any commands specified*/
    _createCommandAliases() {
        // Read in command rebindings
        if (!this.Config.commandBindings || !_.isArray(this.Config.commandBindings)) return;

        this.Config.commandBindings.forEach(commandBinding => {
            if (!commandBinding.alias || !commandBinding.command) {
                logger.error(t('aliases.improperStructure'));
                return;
            }
            if (!this.Commands.has(commandBinding.command)) {
                logger.error(t('aliases.doesNotExist', {
                    alias: commandBinding.command,
                    command: commandBinding.alias
                }));
                return;
            }
            if (this.Commands.has(commandBinding.alias)) {
                logger.error(t('aliases.alreadyExists', {
                    alias: commandBinding.command,
                    command: commandBinding.alias
                }));
                return;
            }
            this.Commands.set(commandBinding.alias, this.Commands.get(commandBinding.command));
        });
    };

    /**
     * Reload all dynamic assets
     * @param {bool} [clearCahce=false] Should the assets also be uncached
     */
    _loadDynamicAssets(clearCache = false) {
        // Clear dynamic assets
        if (clearCache) {
            // Clear all existing jobs
            scheduler.clear();
            // Clear Dynamic Collections
            dynCollections.each(v => this[v].clear());
            // Clear Loaded Scripts
            this.LoadedScripts = [];
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

    /**
     *  Boostrap the Bot, by either killing the process or reloading dynamic assets
     * @param {bool} [hard=false] Should We terminate the process
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
    };

    /**
     *  Normalie text, replacing non print chars with nothing and fake space chars with a real space
     * @param {string} text The text to normalize
     */
    _normalizeText(text) {
        if (_.isUndefined(text) || !_.isString(text)) return text;
        return c
            .stripColorsAndStyle(text) // Strip styles and color
            .replace(helpers.RemoveNonPrintChars, '') // Remove non printable characters
            .replace(helpers.FakeSpaceChars, '\u0020') // Replace fake spaces with space
            .trim();
    };

    /**
     * IRC Action handler
     * @param {string} from Nick sending the message
     * @param {string} to Nick/Channel the message was received on
     * @param {string} text The message content
     * @param {object} message IRC information such as user, and host
     */
    _handleAction(from, to, text, message) {
        text = this._normalizeText(text);
        // Do not handle our own actions, or those on the ignore list
        if (from == this.nick || _.includes(this.Ignore, _.toLower(from))) return;
        this.OnAction.forEach((value, key) => {
            try {
                value.call(from, to, text, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'onAction'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC Nick changes handler
     * @param {string} oldnick Original nickname received
     * @param {string} newnick The new nick the user has taken
     * @param {string} channels The IRC channels this was observed on
     * @param {object} message IRC information such as user, and host
     */
    _handleNickChanges(oldnick, newnick, channels, message) {
        // Return if user is on ignore list
        if (_.includes(this.Ignore, _.toLower(oldnick)) || _.includes(this.Ignore, _.toLower(newnick))) return;

        // track if the bots nick was changed
        if (oldnick === this.nick) this.nick = newnick;

        // Run events
        this.NickChanges.forEach((value, key) => {
            try {
                value.call(oldnick, newnick, channels, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'nickChange'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC Notice handler
     * @param {string} from Nick sending the message
     * @param {string} to Nick/Channel the message was received on
     * @param {string} text The message content
     * @param {object} message IRC information such as user, and host
     */
    _handleOnNotice(from, to, text, message) {
        // Do not handle our own actions, or those on the ignore list
        if (from == this.nick || _.includes(this.Ignore, _.toLower(from))) return;

        this.OnNotice.forEach((value, key) => {
            try {
                value.call(from, to, text, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'onNotice'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC On Join Handler
     * @param {string} channel The Channel observed
     * @param {string} nick The Nick that joined
     * @param {object} message IRC information such as user, and host
     */
    _handleOnJoin(channel, nick, message) {
        // Handle Ignore
        if (_.includes(this.Ignore, _.toLower(nick))) return;

        if (nick == this.nick) logger.info(t('events.channelJoined', {
            channel
        }));

        this.OnJoin.forEach((value, key) => {
            try {
                value.call(channel, nick, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'onJoin'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC On Part Handler
     * @param {string} channel The Channel observed
     * @param {string} nick The Nick observed
     * @param {string} reason The part reason
     * @param {object} message IRC information such as user, and host
     */
    _handleOnPart(channel, nick, reason, message) {
        reason = this._normalizeText(reason);

        // Handle Ignore
        if (_.includes(this.Ignore, _.toLower(nick))) return;

        if (nick == this.nick) logger.info(t('events.channelParted', {
            channel,
            reason
        }));

        this.OnPart.forEach((value, key) => {
            try {
                value.call(channel, nick, reason, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'onPart'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC on Kick Handler
     * @param {string} channel Channel observed
     * @param {string} nick Nick being kicked
     * @param {string} by Nick doing kick
     * @param {string} reason Reason for kick
     * @param {object} message IRC information such as user, and host
     */
    _handleOnKick(channel, nick, by, reason, message) {
        reason = this._normalizeText(reason);

        //  Handle Ignore
        if (_.includes(this.Ignore, _.toLower(nick))) return;

        if (nick == this.nick) logger.info(t('events.kickLoggingBy', {
            channel,
            by,
            reason
        }));

        if (by == this.nick) logger.info(t('events.kickLoggingFrom', {
            nick,
            channel,
            reason
        }));

        this.OnKick.forEach((value, key) => {
            try {
                value.call(channel, nick, by, reason, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'onKick'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC on Quit Handler
     * @param {string} nick Nick being kicked
     * @param {string} reason Reason for kick
     * @param {array} channels List of channels observed
     * @param {object} message IRC information such as user, and host
     */
    _handleOnQuit(nick, reason, channels, message) {
        reason = this._normalizeText(reason);
        //  Handle Ignore
        if (_.includes(this.Ignore, _.toLower(nick))) return;

        if (nick == this.nick) logger.info(t('events.quitLogging', {
            channels: channels.join(', '),
            reason
        }));

        this.OnQuit.forEach((value, key) => {
            try {
                value.call(nick, reason, channels, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'onQuit'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC on Topic Handler
     * @param {string} channel Channel observed having topic changed
     * @param {string} topic Topic set
     * @param {string} nick Nick observed setting the topic
     * @param {object} message IRC information such as user, and host
     */
    _handleOnTopic(channel, topic, nick, message) {
        topic = this._normalizeText(topic);
        //  Handle Ignore
        if (_.includes(this.Ignore, _.toLower(nick))) return;

        if (nick == this.nick) logger.info(t('events.topicLogging', {
            channel,
            topic
        }));

        this.OnTopic.forEach((value, key) => {
            try {
                value.call(channel, topic, nick, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'opTopic'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC on CTCP Handler
     * @param {string} from Nick sending the CTCP Message
     * @param {string} to Channel / Nick sent the CTCP Message
     * @param {string} text Content of more message
     * @param {string} type The type of CTCP mMessage
     * @param {object} message IRC information such as user, and host
     */
    _handleCtcpCommands(from, to, text, type, message) {
        text = this._normalizeText(text);

        //  Bail on self or ignore
        if (from == this.nick || _.includes(this.Ignore, _.toLower(from)) || (type == 'privmsg' && text.startsWith('ACTION'))) return;

        this.OnCtcp.forEach((value, key) => {
            try {
                value.call(from, to, text, type, message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'ctcpCommands'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC on Registered handler
     * @param {object} message Message returned from server
     */
    _handleRegistered(message) {
        logger.info(t('events.registeredToIrc'));

        this.Registered.forEach((value, key) => {
            try {
                value.call(message);
            } catch (err) {
                logger.error(t('errors.genericError', {
                    command: 'handleRegistered'
                }), {
                    err
                });
            }
        });
    };

    /**
     * IRC Bot Command Handler
     * @param {string} from Nick the Command originated from
     * @param {string} to Nick / Channel the command is to
     * @param {string} text Content of the message
     * @param {object} message IRC information such as user, and host
     */
    _handleCommands(from, to, text, message) {
        // Normalize text
        text = this._normalizeText(text);

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
                } catch (err) {
                    logger.error(t('errors.genericError', {
                        command: 'onCommand onListeners'
                    }), {
                        err
                    });
                }
            });
        }

        // Nothing to see here
        if (!is.triggered || is.ignored || is.self || !this.Commands.has(cmd)) return;

        // Grab Command
        let command = this.Commands.get(cmd);

        // The user is the owner, them them throught
        if (
            // User is the owner, let them through
            (from === this.Config.owner.nick && message.host === this.Config.owner.host) ||
            // This is a guest account command, let it happen
            (command.access === this.Config.accessLevels.guest) ||
            // This is a channelVoice command and the user is voiced in the channel
            (command.access === this.Config.accessLevels.channelVoice && this._ircClient.isVoiceInChannel(to, from)) ||
            // This is a channelOp command and the user is oped in the channel
            (command.access === this.Config.accessLevels.channelOp && this._ircClient.isOpOrVoiceInChannel(to, from))
        ) {
            try {
                // Call Function
                command.call(to, from, output, message, is);
                // Record Stats
                this.Stats.set(cmd, this.Stats.has(cmd) ? this.Stats.get(cmd) + 1 : 1);
                // Log
                logger.info(t('events.commandTriggered', {
                    from,
                    to,
                    cmd,
                    group: helpers.AccessString(command.access),
                }));
            } catch (err) {
                if (this.Config.bot.debug === true) console.dir(err);
                logger.error(t('errors.procCommand', {
                    command: cmd
                }), {
                    err
                });
            }
        }
        // The following administration levels piggy back on services, thus we check the acc status of the account and defer
        else if (
            command.access === this.Config.accessLevels.identified ||
            command.access === this.Config.accessLevels.admin ||
            command.access === this.Config.accessLevels.channelVoiceIdentified ||
            command.access === this.Config.accessLevels.channelOpIdentified
        ) {
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
        // Invalid Command
        else this.say(to, t('errors.invalidCommand', {
            from,
            cmd
        }));
    };

    /**
     * IRC Identified Command Handler
     * @param {string} nick Nick Command was fired by
     * @param {string} to Nick / Channel the Command was fired on
     * @param {string} text Message Content
     * @param {object} message IRC information such as user, and host
     * @returns {boolean} command status
     */
    _handleAuthenticatedCommands(nick, to, text, message) {
        text = this._normalizeText(text);

        // Parse vars
        let [user, acc, code] = text.split(' ');

        // Does not exist in call back, return
        if (!this.AdmCallbacks.has(user)) return false;

        let admCall = this.AdmCallbacks.get(user),
            admCmd = this.Commands.get(admCall.cmd),
            admTextArray = admCall.text.split(' ');

        // Check if the user is identified, pass it along in the is object
        admCall.is.identified = code == this.Config.nickserv.accCode;

        // Clean the output
        admTextArray.splice(0, admCall.to === admCall.from ? 1 : 2);
        let output = admTextArray.join(' ');

        // This is a identified command and the user is not identified
        if (!admCall.is.identified) {
            this.say(admCall.from, t('auth.notIdentified'));
            this.AdmCallbacks.delete(user);
            return false;
        }

        // Gate
        if (
            // This is an admin command, and the user is not on the admin list
            (admCmd.access === this.Config.accessLevels.admin && !_.includes(this.Admins, _.toLower(admCall.from))) ||
            // This is a channelOpIdentified command, and the user is not opped in the channel
            (admCmd.access === this.Config.accessLevels.channelOpIdentified && !this._ircClient.isOpInChannel(admCall.to, admCall.from)) ||
            // This is a channelVoiceIdentified command, and the user is not voiced or opped in the channel
            (admCmd.access === this.Config.accessLevels.channelVoiceIdentified && !this._ircClient.isOpOrVoiceInChannel(admCall.to, admCall.from))
        ) {
            let group = helpers.AccessString(admCmd.access);
            this.say(admCall.to, t('auth.notMemberOfGroup', {
                group
            }));
            logger.error(t('auth.notMemberOfGroupLogging', {
                nick: admCall.from,
                channel: admCall.to,
                group: group,
                type: admCall.cmd
            }));
            this.AdmCallbacks.delete(user);
            return false;
        }

        // Launch the command
        try {
            // Call the command
            let command = this.Commands.get(admCall.cmd);
            command.call(admCall.to, admCall.from, output, admCall.message, admCall.is);
            // Record Stats
            this.Stats.set(admCall.cmd, this.Stats.has(admCall.cmd) ? this.Stats.get(admCall.cmd) + 1 : 1);
            // Log
            logger.info(t('events.commandTriggered', {
                from: admCall.from,
                to: admCall.to,
                cmd: admCall.cmd,
                group: helpers.AccessString(command.access),
            }));
        } catch (err) {
            logger.error(t('errors.invalidIdentCommand', {
                cmd: admCall.cmd,
                from: admCall.from,
                to: admCall.to,
            }));
        }

        // Remove the callback from the stack
        this.AdmCallbacks.delete(user);
        return true;
    };

    /**
     * Say something over IRC
     * @param {string} target Nick / Channel to say it to
     * @param {string} message What to say
     */
    say(target, message) {
        if (!_.isString(message) || _.isEmpty(message.trim())) return;
        let msg = randomString(message);
        logger.info(t('events.sentMessage', {
            target: target,
            message: c.stripColorsAndStyle(msg)
        }), {
            original: msg
        });

        this._ircClient.say(target, msg);
    };

    /**
     * Perform an Action over IRC
     * @param {string} target Nick / Channel to say it to
     * @param {string} message What to say
     */
    action(target, message) {
        if (!_.isString(message) || _.isEmpty(message.trim())) return;
        let msg = randomString(message);
        logger.info(t('events.sentAction', {
            target: target,
            message: c.stripColorsAndStyle(msg)
        }), {
            original: msg
        });

        this._ircClient.action(target, msg);
    };

    /**
     * Perform a Notice over IRC
     * @param {string} target Nick / Channel to say it to
     * @param {string} message What to say
     */
    notice(target, message) {
        if (!_.isString(message) || _.isEmpty(message.trim())) return;
        let msg = randomString(message);

        logger.info(t('events.sentNotice', {
            target: target,
            message: c.stripColorsAndStyle(msg)
        }), {
            original: msg
        });

        this._ircClient.notice(target, msg);
    };

    /** Reload Bots Configuration Object */
    reloadConfiguration() {
        logger.info(t('bootstrap.reloadConfig'));

        this._clearCache('./config.js');
        this.Config = require('./config.js');
        // Assure AutoConnect flag is not reset
        this.Config.irc.autoConnect = false;
    };

    // Properties

    /** Bots IRC Nickname */
    get nick() {
        return this._ircClient.nick;
    };
    set nick(newNick) {
        // If we do not have a provided nick, use the settings default
        newNick = newNick || this.Config.irc.nick;
        logger.info(t('events.nickChanged', {
            oldNick: this.nick,
            newNick
        }));
        this._ircClient.send('nick', newNick);
        this._ircClient.nick = newNick;
        this._ircClient.originalNick = newNick;
    };

    /** Get a list of joined IRC channels */
    get channels() {
        return _(this._ircClient.chans).keys().uniq().value();
    };
    set channels(value) {
        // Given an array
        if (_.isArray(value)) value.forEach(channel => {
            if (!this._ircClient.isInChannel(channel)) {
                this._ircClient.join(channel);
            }
        });
        // Given a string
        else if (_.isString(value)) {
            value.split(' ').forEach(channel => {
                if (!this._ircClient.isInChannel(channel)) {
                    this._ircClient.join(channel);
                }
            });
        }
    };

}


/** Expose the Bot */
module.exports = MrNodeBot;
