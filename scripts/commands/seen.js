const scriptInfo = {
    name: 'Seen',
    desc: 'Get stats on the last activity of a IRC user',
    createdBy: 'IronY',
};
// Includes
const _ = require('lodash');
const Moment = require('moment');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const gen = require('../generators/_getLastUsageData');
const getBestGuess = require('../generators/_nickBestGuess');

// Set a upper limit to prevent infinite recursions in some edge case situations

// Exports
module.exports = app => {
    // Bail if we do not have a complete set of database tables
    if (!Models.Logging ||
        !Models.Topics ||
        !Models.ActionLogging ||
        !Models.NoticeLogging ||
        !Models.JoinLogging ||
        !Models.PartLogging ||
        !Models.QuitLogging ||
        !Models.KickLogging ||
        !Models.Alias) return scriptInfo;

    // Set a recursion limit
    const allowRecursion = _.getBoolean(_.get(app.Config, 'features.seen.allowRecursion', true), true);
    const maxIteration = _.getNumber(_.get(app.config, 'features.seen.recursionLimit', 5), 5);

    /**
     * Seen handler
     * @param to
     * @param from
     * @param text
     * @param message
     * @param lastLine
     * @param iteration
     * @param descending
     * @returns {Promise<void>}
     */
    const seenHandler = async (to, from, text, message, lastLine, iteration = 0, descending = true) => {
        if (iteration >= maxIteration) return;

        // Gate
        if (!_.isString(text) || _.isEmpty(text)) {
            app.say(to, `I need someone to look for ${from}`);
            return;
        }

        // Normalize Iteration, this is used to chain
        iteration = _.isSafeInteger(iteration) && iteration >= 0 ? iteration : 0;

        // Send to IRC
        const sendToIRC = (result) => {
            // No Data available for user
            if (_.isEmpty(result) || _.isEmpty(result.finalResults)) {
                app.say(to, `I have no data on ${result.args.nick || result.args.user || result.args.host}`);
                return;
            }

            // Hold the output
            const output = new typo.StringBuilder();
            const lastSaid = result.lastSaid;
            const lastAction = result.lastAction;

            // See if there has been anything said by the user, append to buffer if so
            if (
                _.isObject(lastSaid) &&
                !_.isEmpty(lastSaid)
            ) {
                if (!iteration) {
                    if (result.originalNick) {
                        output.appendBold(result.originalNick);
                    }
                    output.appendBold(lastSaid.from).insert('Saying');
                }
                else {
                    output.insert('Then saying');
                }
                output
                    .insertBold(lastSaid.text)
                    .insert('via')
                    .insert(_.startCase(lastSaid.key))
                    .insert('on')
                    .insertBold(lastSaid.to)
                    .insert(Moment(lastSaid.timestamp).fromNow())
                    .insertDivider();
            }

            // We have an action, filter and vary output style
            if (_.isObject(lastAction) && !_.isEmpty(lastAction)) {
                switch (lastAction.key) {
                case 'part':
                    output.insert('Parting')
                        .insertBold(lastAction.channel)
                        .insert(Moment(lastAction.timestamp).fromNow());
                    if (!lastSaid || lastAction.nick !== lastSaid.from) output.insert('as').insertBold(lastAction.nick);
                    output.appendBold(lastAction.reason);
                    break;
                case 'quit':
                    output.insert('Quitting').insertBold(!_.isEmpty(lastAction.channels) ? `[${lastAction.channels.replace(',', ', ')}]` : 'on');
                    output.insert(Moment(lastAction.timestamp).fromNow());
                    if (!lastSaid || lastAction.nick !== lastSaid.from) output.insert('as').insertBold(lastAction.nick);
                    output.insert(lastAction.reason);
                    break;
                case 'kick':
                    output.insert('Getting kicked from')
                        .insertBold(lastAction.channel)
                        .insert(lastAction.timestamp);
                    if (!lastSaid || lastAction.nick !== lastSaid.from) output.insert('as').insertBold(lastAction.nick);
                    output.insert(lastAction.reason);
                    break;
                case 'join':
                    output.insert('Joining')
                        .insertBold(lastAction.channel)
                        .insert(Moment(lastAction.timestamp).fromNow());
                    if (!lastSaid || lastAction.nick !== lastSaid.from) output.insert('as').insertBold(lastAction.nick);
                    break;
                case 'aliasOld':
                    const outputLine = `${lastAction.newnick || ''}!${lastAction.user || ''}@${lastAction.host || ''} ${lastSaid.to || lastAction.channel || ''}`;

                    // Prevent edge case caused by nick switching
                    if (outputLine === lastLine) return;

                    output.insert('Changing their nick to').insertBold(lastAction.newnick)
                        .insert('on').insertBold(`[${lastAction.channels.replace(',', ', ')}]`)
                        .insert(Moment(lastAction.timestamp).fromNow());

                    if (!allowRecursion) break;

                    // Recurse
                    seen(to, from, text, message, outputLine, iteration + 1, descending);
                    break;
                case 'aliasNew':
                    output.insert('Changing their nick from').insertBold(lastAction.oldnick)
                        .insert('on').insertBold(`[${lastAction.channels.replace(',', ', ')}]`)
                        .insert(Moment(lastAction.timestamp).fromNow());
                    break;
                case 'topic':
                    output.insert('Changing the topic in')
                        .insertBold(lastAction.channel)
                        .insert(Moment(lastAction.timestamp).fromNow());
                    break;
                }
            }

            // Begin the Line
            if (iteration === 0 && !_.isEmpty(output.text)) output.prepend(iteration === 0 ? 'Seen' : '|');

            // report back to IRC
            // First result to channel, any chains elsewhere
            if (iteration === 1 && from !== to) {
                app.say(to, `additional seen results have been messaged to you, ${from}`);
            }

            app.say(iteration === 0 ? to : from, !_.isEmpty(output.text) ? output.text : `It seems there is no more data for ${result.args.nick || result.args.user || result.args.host}, ${from}`);
        };

        try {
            const initialNick = text.split(' ')[0];

            // Get best guess nick
            const bestGuess = await getBestGuess(initialNick);
            const finalNick = bestGuess && bestGuess.hasOwnProperty('nearestNeighbor') && bestGuess.nearestNeighbor.hasOwnProperty('from') ? bestGuess.nearestNeighbor.from : initialNick;
            const result = await gen(finalNick, {descending});

            if (initialNick !== bestGuess) {
                result.originalNick = initialNick;
            }

            sendToIRC(result);
        } catch (err) {
            logger.error('Error in the last active Promise.all chain', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong finding the active state for ${text}, ${from}`);
        }
    };
    app.Commands.set('seen', {
        desc: '[nick!user@host channel] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: seenHandler,
    });

    /**
     * First Seen Handler
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const firstSeenHandler = (to, from, text, message) => seenHandler(to, from, text, message, null, 0, false);
    app.Commands.set('first-seen', {
        desc: '[nick!user@host channel] shows the first activity of the user',
        access: app.Config.accessLevels.identified,
        call: firstSeenHandler,
    });

    // Return the script info
    return scriptInfo;
};
