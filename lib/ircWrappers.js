const c = require('irc-colors');
const _ = require('lodash');
const t = require('./localize');
const nn = require('nearest-neighbor');
const logger = require('./logger');
const helpers = require('../helpers');
const chatBotLine = require('./chatBotLine');

/**
 * Invalid empty command response options
 * @type {[String]}
 */
const replyOptions = [
    'Quoi de neuf?',
    'What\'s up?',
    'Que passa?',
    'Miten menee?',
    'Was ist los?',
];

class IrcWrappers {
    /**
     * IRC Wrapper helpers
     * @param appInstance
     */
    constructor(appInstance) {
        this.app = appInstance;
    }

    /**
     *  Normalize text, replacing non print chars with nothing and fake space chars with a real space
     * @param {string} text The text to normalize
     */
    static _normalizeText(text) {
        if (_.isUndefined(text) || !_.isString(text)) return text;
        return c
            .stripColorsAndStyle(text) // Strip styles and color
            .replace(helpers.RemoveNonPrintChars, '') // Remove non printable characters
            .replace(helpers.FakeSpaceChars, '\u0020') // Replace fake spaces with space
            .trim();
    }

    /**
     * IRC Action handler
     * @param {string} from - Nick sending the message
     * @param {string} to - Nick/Channel the message was received on
     * @param {string} text - The message content
     * @param {object} message - IRC information such as user, and host
     */
    handleAction(from, to, text, message) {
        const normalizedText = IrcWrappers._normalizeText(text);


        // Do not handle our own actions, or those on the ignore list
        if (from === this.app.nick || _.includes(this.app.Ignore, _.toLower(from))) return;

        this.app.OnAction.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, from, to, normalizedText, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'onAction',
                }), err);
            }
        });
    }

    /**
     * IRC on Kick Handler
     * @param {string} channel - Channel observed
     * @param {string} nick - Nick being kicked
     * @param {string} by - Nick doing kick
     * @param {string} reason - Reason for kick
     * @param {object} message - IRC information such as user, and host
     */
    handleOnKick(channel, nick, by, reason, message) {
        const normalizedReason = IrcWrappers._normalizeText(reason);

        //  Handle Ignore
        if (_.includes(this.app.Ignore, _.toLower(nick))) return;

        if (nick === this.app.nick) {
            logger.info(t('events.kickLoggingBy', {
                channel,
                by,
                reason,
            }));
        }

        if (by === this.app.nick) {
            logger.info(t('events.kickLoggingFrom', {
                nick,
                channel,
                normalizedReason,
            }));
        }

        this.app.OnKick.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, channel, nick, by, normalizedReason, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'onKick',
                }), err);
            }
        });
    }

    /**
     * IRC Nick changes handler
     * @param {string} oldNick - Original nickname received
     * @param {string} newNick - The new nick the user has taken
     * @param {string} channels - The IRC channels this was observed on
     * @param {object} message - IRC information such as user, and host
     */
    handleNickChanges(oldNick, newNick, channels, message) {
        // Return if user is on ignore list
        if (_.includes(this.app.Ignore, _.toLower(oldNick)) || _.includes(this.app.Ignore, _.toLower(newNick))) return;

        // track if the bots nick was changed
        if (oldNick === this.app.nick) this.app.nick = newNick;

        // Run events
        this.app.NickChanges.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, oldNick, newNick, channels, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'nickChange',
                }), err);
            }
        });
    }

    /**
     * IRC Notice handler
     * @param {string} from Nick sending the message
     * @param {string} to Nick/Channel the message was received on
     * @param {string} text The message content
     * @param {object} message IRC information such as user, and host
     */
    handleOnNotice(from, to, text, message) {
        // Do not handle our own actions, or those on the ignore list
        if (from === this.app.nick || _.includes(this.app.Ignore, _.toLower(from))) return;

        this.app.OnNotice.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, from, to, text, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'onNotice',
                }), err);
            }
        });
    }

    /**
     * IRC On Join Handler
     * @param {string} channel The Channel observed
     * @param {string} nick The Nick that joined
     * @param {object} message IRC information such as user, and host
     */
    handleOnJoin(channel, nick, message) {
        // Handle Ignore
        if (_.includes(this.app.Ignore, _.toLower(nick))) return;

        if (nick === this.app.nick) {
            logger.info(t('events.channelJoined', {
                channel,
            }));
        }

        this.app.OnJoin.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, channel, nick, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'onJoin',
                }), err);
            }
        });
    }

    /**
     * IRC On Part Handler
     * @param {string} channel The Channel observed
     * @param {string} nick The Nick observed
     * @param {string} reason The part reason
     * @param {object} message IRC information such as user, and host
     */
    handleOnPart(channel, nick, reason, message) {
        const normalizedReason = IrcWrappers._normalizeText(reason);

        // Handle Ignore
        if (_.includes(this.app.Ignore, _.toLower(nick))) return;

        if (nick === this.app.nick) {
            logger.info(t('events.channelParted', {
                channel,
                normalizedReason,
            }));
        }

        this.app.OnPart.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, channel, nick, normalizedReason, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'onPart',
                }), err);
            }
        });
    }

    /**
     * IRC on Quit Handler
     * @param {string} nick Nick being kicked
     * @param {string} reason Reason for kick
     * @param {array} channels List of channels observed
     * @param {object} message IRC information such as user, and host
     */
    handleOnQuit(nick, reason, channels, message) {
        const normalizedReason = IrcWrappers._normalizeText(reason);
        //  Handle Ignore
        if (_.includes(this.app.Ignore, _.toLower(nick))) return;

        if (nick === this.app.nick) {
            logger.info(t('events.quitLogging', {
                channels: _.isObject(channels) ? Object.keys(channels).join(', ') : channels,
                normalizedReason,
            }));
        }

        this.app.OnQuit.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, nick, normalizedReason, channels, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'onQuit',
                }), err);
            }
        });
    }

    /**
     * IRC on Topic Handler
     * @param {string} channel Channel observed having topic changed
     * @param {string} topic Topic set
     * @param {string} nick Nick observed setting the topic
     * @param {object} message IRC information such as user, and host
     */
    handleOnTopic(channel, topic, nick, message) {
        const normalizedTopic = IrcWrappers._normalizeText(topic);

        //  Handle Ignore
        if (_.includes(this.app.Ignore, _.toLower(nick))) return;

        if (nick === this.app.nick) {
            logger.info(t('events.topicLogging', {
                channel,
                normalizedTopic,
            }));
        }

        this.app.OnTopic.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, channel, normalizedTopic, nick, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'opTopic',
                }), err);
            }
        });
    }

    /**
     * IRC on CTCP Handler
     * @param {string} from Nick sending the CTCP Message
     * @param {string} to Channel / Nick sent the CTCP Message
     * @param {string} text Content of more message
     * @param {string} type The type of CTCP mMessage
     * @param {object} message IRC information such as user, and host
     */
    handleCtcpCommands(from, to, text, type, message) {
        const normalizedText = IrcWrappers._normalizeText(text);

        //  Bail on self or ignore
        if (from === this.app.nick || _.includes(this.app.Ignore, _.toLower(from)) || (type === 'privmsg' && normalizedText.startsWith('ACTION'))) return;

        this.app.OnCtcp.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, from, to, normalizedText, type, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'ctcpCommands',
                }), err);
            }
        });
    }

    /**
     * IRC on Registered handler
     * @param {object} message Message returned from server
     */
    handleRegistered(message) {
        logger.info(t('events.registeredToIrc'));
        this.app.Registered.forEach(async (command, key) => {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, message);

                if (isPromise) return await call();
                call();
            } catch (err) {
                this.app._errorHandler(t('errors.genericError', {
                    command: 'handleRegistered',
                }), err);
            }
        });
    }

    /**
     * IRC Bot Command Handler
     * @param {string} from Nick the Command originated from
     * @param {string} to Nick / Channel the command is to
     * @param {string} text Content of the message
     * @param {object} message IRC information such as user, and host
     */
    async handleCommands(from, to, text, message) {
        const normalizedText = IrcWrappers._normalizeText(text);

        // Build the is object to pass along to the command router
        const is = {
            ignored: _.includes(this.app.Ignore, _.toLower(from)),
            self: from === this.app._ircClient.nick,
            privateMsg: to === from,
        };

        // Format the text, extract the command, and remove the trigger / command to send to handler
        const trigger = ((_.isUndefined(this.app.Config.bot.trigger) || _.isEmpty(this.app.Config.bot.trigger)) ? this.app._ircClient.nick : this.app.Config.bot.trigger).toLowerCase();
        const triggerSpace = (_.isUndefined(this.app.Config.bot.triggerSpace) || !_.isBoolean(this.app.Config.bot.triggerSpace)) ? true : this.app.Config.bot.triggerSpace;
        const textArray = normalizedText.split(' ');

        const preCmd = triggerSpace ? (is.privateMsg ? textArray[0] : textArray[1]) : textArray[0].replace(trigger, '');
        const cmd = _.isString(preCmd) ? preCmd.toLowerCase() : preCmd;

        textArray.splice(0, triggerSpace ? (is.privateMsg ? 1 : 2) : 1);
        const output = textArray.join(' ');

        const triggerMatched = normalizedText.toLowerCase().startsWith(trigger);
        const hasCommand = this.app.Commands.has(cmd);
        const validMatchedCommand = triggerMatched && hasCommand;
        const matchedInvalidCommand = triggerMatched && !hasCommand;

        // Check on trigger for private messages
        is.triggered = (is.privateMsg && hasCommand) || validMatchedCommand;

        // Process the listeners
        if (!is.triggered && !is.ignored && !is.self) {
            this.app.Listeners.forEach(async (command, key) => {
                try {
                    // Is the callback a promise?
                    const isPromise = helpers.isAsync(command.call);

                    // Call Function
                    const call = command.call.bind(this.app, to, from, normalizedText, message, is);

                    if (isPromise) return await call();
                    call();
                } catch (err) {
                    this.app._errorHandler(t('errors.genericError', {
                        command: 'onCommand OnListeners',
                    }), err);
                }
            });
        }

        // Invalid Matched Command
        if (matchedInvalidCommand) {
            // No command given
            if (!cmd || _.isEmpty(cmd)) {
                // prevent spam if we are in a more lose triggering mechanism
                if (!triggerSpace) this.app.say(to, `${from}, {${replyOptions.join('|')}}`);
                return false;
            }

            // Attempt to get a best guess
            const bestGuess = await new Promise((res, rej) => {
                nn.findMostSimilar({ cmd: cmd }, this.app.commandMap, [
                    { name: 'cmd', measure: nn.comparisonMethods.word },
                ], function (nearestNeighbor, probability) {
                    res({
                        nearestNeighbor,
                        probability,
                    });
                });
            });

            // The command is invalid, but we have a likely guess at what it is
            if (
                !_.isEmpty(bestGuess) &&
                bestGuess.probability && bestGuess.nearestNeighbor && bestGuess.nearestNeighbor.cmd &&
                bestGuess.probability >= 0.5) {
                this.app.say(to,
                    `Sorry ${from}, ${cmd} is not an option. Perhaps you meant "${bestGuess.nearestNeighbor.cmd}" ${this.app.Commands.has(bestGuess.nearestNeighbor.cmd) && this.app.Commands.get(bestGuess.nearestNeighbor.cmd).desc ? ' (' + this.app.Commands.get(bestGuess.nearestNeighbor.cmd).desc + ')' : ''}?`
                );
            }
            // No idea
            else {
                const actualText = `${cmd} ${output}`.trim();
                this.app.say(from, t('errors.invalidCommand', {
                    from,
                    cmd: actualText,
                }));

            }
            return false;
        }

        // Nothing to see here
        if (!is.triggered || is.ignored || is.self || !hasCommand) {
            if (to === from) {
                const result = await chatBotLine(text);
                this.app.say(from, result);
            }
            return false;
        }

        // Grab Command
        const command = this.app.Commands.get(cmd);

        // Identifiers
        const owner = () => from === this.app.Config.owner.nick && message.host === this.app.Config.owner.host;
        const guestCommand = () => command.access === this.app.Config.accessLevels.guest;
        const validChannelVoiceUser = () => command.access === this.app.Config.accessLevels.channelVoice && this.app._ircClient.isVoiceInChannel(to, from);
        const channelOpUser = () => command.access === this.app.Config.accessLevels.channelOp && this.app._ircClient.isOpOrVoiceInChannel(to, from);

        // Hand the Identifier functions over to is to get passed into the script command
        Object.assign(is, {
            owner,
            guestCommand,
            validChannelVoiceUser,
            channelOpUser,
        });

        // Requires
        const requiresIdentified = () => command.access === this.app.Config.accessLevels.identified;
        const requiresAdmin = () => command.access === this.app.Config.accessLevels.admin;
        const requiresChannelVoiceIdentified = () => command.access === this.app.Config.accessLevels.channelVoiceIdentified;
        const requiresChannelOpIdentified = () => command.access === this.app.Config.accessLevels.channelOpIdentified;

        // Handle commands with non identified status
        if (owner() || guestCommand() || validChannelVoiceUser() || channelOpUser()) {
            try {
                // Is the callback a promise?
                const isPromise = helpers.isAsync(command.call);

                // Call Function
                const call = command.call.bind(this.app, to, from, output, message, is);
                if (isPromise) await call();
                else call();

                // Record Stats
                this.app.Stats.set(cmd, this.app.Stats.has(cmd) ? this.app.Stats.get(cmd) + 1 : 1);

                // Log
                logger.info(t('events.commandTriggered', {
                    from,
                    to,
                    cmd,
                    group: helpers.AccessString(command.access),
                }));
            } catch (err) {
                this.app._errorHandler(t('errors.procCommand', {
                    command: cmd,
                }), err);
            }
        }
        // The following administration levels piggy back on services, thus we check the acc status of the account and defer
        else if (requiresIdentified() || requiresAdmin() || requiresChannelVoiceIdentified() || requiresChannelOpIdentified()) {
            // Append timestamp to prevent unique collisions
            this.app.AdmCallbacks.set(`${from}.${Date.now()}`, {
                cmd, from, to, text: normalizedText, message, is,
            });

            // Send a check to nickserv to see if the user is registered
            // Will spawn the notice listener to do the rest of the work
            const first = this.app.Config.nickserv.host ? `@${this.app.Config.nickserv.host}` : '';
            this.app.say(`${this.app.Config.nickserv.nick}${first}`, `acc ${from}`);
        }
        // Invalid Command
        else {
            this.app.say(from, t('errors.invalidCommand', {
                from,
                cmd: cmd.trim(),
            }));
        }
    }

    /**
     * Handle channel forwards
     * TODO Implement
     * @param nick
     * @param originalChannel
     * @param forwardedChannel
     * @param dialog
     * @return {Promise<void>}
     */
    async handleChannelForward(nick, originalChannel, forwardedChannel, dialog) {
        // TODO implement
        logger.info('Channel Forward encountered', {
            nick,
            originalChannel,
            forwardedChannel,
            dialog,
        });
    }


    /**
     * IRC Identified Command Handler
     * @param {string} nick Nick Command was fired by
     * @param {string} to Nick / Channel the Command was fired on
     * @param {string} text Message Content
     * @param {object} message IRC information such as user, and host
     * @returns {boolean} command status
     */
    async handleAuthenticatedCommands(nick, to, text, message) {
        const normalizedText = IrcWrappers._normalizeText(text);

        // Parse vars
        const [user, acc, code] = normalizedText.split(' ');

        let currentIndex = 0;

        let currentUser;
        let currentTimestamp;

        // Find an Admin command request matching the name of the response
        this.app.AdmCallbacks.forEach((v, i, m) => {
            // Short circuit
            if (currentIndex) return;

            // Initial validation gate
            if (!_.isString(i) || _.isEmpty(i) || !_.isObject(v)) return;

            // Match against the time format used to ensure uniqueness
            const matches = i.match(/([^.]*).(.*)/);

            // No matches available, malformed, return
            if (!matches[0] || !matches[1] || !matches[2]) return;

            // If the match belongs to the current user, assign values
            if (matches[1] === user) {
                currentIndex = matches[0];
                currentUser = matches[1];
                currentTimestamp = matches[2];
            }
        });

        // Does not exist in call back, return
        if (!currentUser || !currentTimestamp || !currentIndex) return false;

        const admCall = this.app.AdmCallbacks.get(currentIndex);
        const admCmd = this.app.Commands.get(admCall.cmd);
        const admTextArray = admCall.text.split(' ');

        // Check if the user is identified, pass it along in the is object
        admCall.is.identified = code === this.app.Config.nickserv.accCode;

        // Clean the output
        admTextArray.splice(0, _.isUndefined(this.app.Config.bot.trigger) ? (admCall.to === admCall.from ? 1 : 2) : 1);

        const output = admTextArray.join(' ');

        // This is a identified command and the user is not identified
        if (!admCall.is.identified) {
            this.app.say(admCall.to, t('auth.notIdentified', {
                cmd: admCall.cmd,
                from: admCall.from,
            }));

            // Remove the index
            this.app.AdmCallbacks.delete(currentIndex);

            return false;
        }

        const invalidAdmin = () => admCmd.access === this.app.Config.accessLevels.admin && !_.includes(this.app.Admins, _.toLower(admCall.from));
        const invalidChannelOp = () => admCmd.access === this.app.Config.accessLevels.channelOpIdentified && !this.app._ircClient.isOpInChannel(admCall.to, admCall.from);
        const invalidChannelVoice = () => admCmd.access === this.app.Config.accessLevels.channelVoiceIdentified && !this.app._ircClient.isOpOrVoiceInChannel(admCall.to, admCall.from);

        // Gate
        if (invalidAdmin() || invalidChannelOp() || invalidChannelVoice()) {
            const group = helpers.AccessString(admCmd.access);
            this.app.say(admCall.to, t('auth.notMemberOfGroup', {
                group,
            }));
            logger.error(t('auth.notMemberOfGroupLogging', {
                nick: admCall.from,
                channel: admCall.to,
                group,
                type: admCall.cmd,
            }));

            this.app.AdmCallbacks.delete(currentIndex);
            return false;
        }

        // Mark that this command was triggered by an identified response
        admCall.is.triggerdByIdent = true;

        // Launch the command
        try {
            // Call the command
            const command = this.app.Commands.get(admCall.cmd);

            // Is the callback a promise?
            const isPromise = helpers.isAsync(command.call);

            // Call Function
            const call = command.call.bind(this.app, admCall.to, admCall.from, output, admCall.message, admCall.is);

            if (isPromise) return await call();
            call();

            // Record Stats
            this.app.Stats.set(admCall.cmd, this.app.Stats.has(admCall.cmd) ? this.app.Stats.get(admCall.cmd) + 1 : 1);

            // Log
            logger.info(t('events.commandTriggered', {
                from: admCall.from,
                to: admCall.to,
                cmd: admCall.cmd,
                group: helpers.AccessString(command.access),
            }));
        } catch (err) {
            this.app._errorHandler(t('errors.invalidIdentCommand', {
                cmd: admCall.cmd,
                from: admCall.from,
                to: admCall.to,
            }), err);
            this.app.say(admCall.to, `Something must really have gone wrong with the ${amdCall.cmd}, ${amdCall.from}`);
        } finally {
            // Remove the callback from the stack
            this.app.AdmCallbacks.delete(currentIndex);
        }
    }
}

module.exports = IrcWrappers;
