/** MrNodeBot IRC Bot By IronY */
'use strict';

// Node Libs
const _ = require('lodash');
const c = require('irc-colors');
const fs = require('fs');
const path = require('path');
const storage = require('node-persist');
const HashMap = require('hashmap');

// Project libs
const helpers = require('./helpers');
const logger = require('./lib/logger');
const scheduler = require('./lib/scheduler');
const randomString = require('./lib/randomString');
const t = require('./lib/localize');

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
        logger.info(t('webServer.starting'));
        this.WebServer = require('./web/server')(this);
        logger.info(t('webServer.started', {
            port: this.Config.express.port
        }));
    };

    // Init the IRC Bot
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
                            if (_.toLower(nick) === _.toLower(this.Config.nickserv.nick)) {
                                this._handleAuthenticatedCommands(nick, to, text, message);
                            } else {
                                this._handleOnNotice(nick, to, text, message);
                            };
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
                } catch (e) {
                    logger.error(e);
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

    // Initialize the user manager
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

    //noinspection JSMethodCanBeStatic
    _clearCache(fullPath) {
        require.uncache(require.resolve(fullPath));
    };

    // Extensions Loader
    // Read all JS files in the scripts directory and evaluate them
    // During the update process this updates the script portions of the code
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

    // Init storage
    _initStorageSubSystem() {
        // Load the storage before the Bot connects (Sync)
        storage.initSync();

        // Load the Ignore list
        storage.getItem('ignored', (err, value) => {
            this.Ignore = value || this.Ignore;
            logger.info(t('storage.ignored', {
                total: this.Ignore.length
            }));
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
            logger.info(t('storage.admins', {
                total: this.Admins.length
            }));
        });
        logger.info(t('storage.initialized'));
    };

    // Read the configuration and alias any commands specified
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

    // Application Bootstrap
    Bootstrap(hard) {
        hard = hard || false;
        if (hard) {
            logger.info(t('bootstrap.rebooting'));
            this._ircClient.disconnect();
            process.exit();
        } else {
            logger.info(t('bootstrap.reloading'));
            this._loadDynamicAssets(true);
        }
    };


    // Drop non ascii and color code/style information
    _normalizeText(text) {
        if (_.isUndefined(text) || !_.isString(text)) return;
        return c
            .stripColorsAndStyle(text) // Strip styles and color
            .replace(helpers.RemoveNonPrintChars, '') // Remove non printable characters
            .replace(helpers.FakeSpaceChars, '\u0020') // Replace fake spaces with space
            .trim() // Trim;
    };

    // Handle Action
    _handleAction(from, to, text, message) {
        text = this._normalizeText(text);
        // Do not handle our own actions, or those on the ignore list
        if (from == this.nick || _.includes(this.Ignore, _.toLower(from))) return;
        this.OnAction.forEach((value, key) => {
            try {
                value.call(from, to, text, message);
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle Nick changes
    _handleNickChanges(oldnick, newnick, channels, message) {
        // Return if user is on ignore list
        if (_.includes(this.Ignore, _.toLower(oldnick)) || _.includes(this.Ignore, _.toLower(newnick))) return;

        // track if the bots nick was changed
        if (oldnick === this.nick) this.nick = newnick;

        // Run events
        this.NickChanges.forEach((value, key) => {
            try {
                value.call(oldnick, newnick, channels, message);
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle On Notices
    _handleOnNotice(from, to, text, message) {
        text = this._normalizeText(text);

        // Do not handle our own actions, or those on the ignore list
        if (from == this.nick || _.includes(this.Ignore, _.toLower(from))) return;

        this.OnNotice.forEach((value, key) => {
            try {
                value.call(from, to, text, message);
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle On Joins
    _handleOnJoin(channel, nick, message) {
        // Handle Ignore
        if (_.includes(this.Ignore, _.toLower(nick))) return;

        if (nick == this.nick) logger.info(t('events.channelJoined', {
            channel
        }));

        this.OnJoin.forEach((value, key) => {
            try {
                value.call(channel, nick, message);
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle On Part
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
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle On Kick
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
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle On Quit
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
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle Topic changes
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
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Handle CTCP commands
    _handleCtcpCommands(from, to, text, type, message) {
        text = this._normalizeText(text);

        //  Bail on self or ignore
        if (from == this.nick || _.includes(this.Ignore, _.toLower(from)) || (type == 'privmsg' && text.startsWith('ACTION'))) return;

        this.OnCtcp.forEach((value, key) => {
            try {
                value.call(from, to, text, type, message);
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Fired when the bot connects to the network
    _handleRegistered(message) {
        logger.info(t('events.registeredToIrc'));

        this.Registered.forEach((value, key) => {
            try {
                value.call(message);
            } catch (e) {
                logger.error(e);
            }
        });
    };

    // Process the commands
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
                } catch (e) {
                    logger.error(e);
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
        text = this._normalizeText(text);

        // Parse vars
        let [user, acc, code] = text.split(' ');

        // Does not exist in call back, return
        if (!this.AdmCallbacks.has(user)) return;

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
                let group = helpers.AccessString(admCmd.access);
                this.say(admCall.from, t('auth.notMemberOfGroup'));

                logger.error(t('auth.nonMemberOfGroupLogging', {
                    nick: admCall.from,
                    channel: admCall.to,
                    group: group,
                    type: admCall.cmd
                }));

                return;
            }

            try {
                this.Commands.get(admCall.cmd).call(admCall.to, admCall.from, output, admCall.message, admCall.is);
            } catch (e) {
                logger.error(e);
            }
        }
        // Is not identified
        else this.say(admCall.from, t('auth.notIdentified'));

        // Remove the callback from the stack
        this.AdmCallbacks.remove(user);
    };

    // Send a message to the target
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

    // Send a action to the target
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

    // Send notice to the target
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

    // Reload the configruation
    reloadConfiguration() {
        logger.info(t('bootstrap.reloadConfig'));

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
        logger.info(t('events.nickChanged', {
            oldNick: this.nick,
            newNick
        }));
        this._ircClient.send('nick', newNick);
        this._ircClient.nick = newNick;
    };

    // Bots IRC Channels
    get channels() {
        return _(this._ircClient.chans).keys().uniq().value();
    };

    // Getting to allow quick setting of channels
    // Warning: Refactoring this down for some odd reason breaks it
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

// Export Class
module.exports = MrNodeBot;
