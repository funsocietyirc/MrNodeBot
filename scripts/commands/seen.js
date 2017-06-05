'use strict';
const scriptInfo = {
    name: 'Seen',
    desc: 'Get stats on the last activity of a IRC user',
    createdBy: 'IronY'
};
// Includes
const _ = require('lodash');
const Moment = require('moment');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const gen = require('../generators/_getLastUsageData');

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

    // Show activity of given host mask
    const seen =  async (to, from, text, message, iteration = 0, descending = true) => {
        // Gate
        if (!_.isString(text) || _.isEmpty(text)) {
            app.say(to, `I need someone to look for ${from}`);
            return;
        }

        // Normalize Iteration, this is used to chain
        iteration = _.isSafeInteger(iteration) && iteration >= 0 ? iteration : 0;

        // Send to IRC
        const sendToIRC = result => {
            // No Data available for user
            if (_.isEmpty(result) || _.isEmpty(result.finalResults)) {
                app.say(to, `I have no data on ${result.args.nick || result.args.user || result.args.host}`);
                return;
            }

            // Hold the output
            let output = new typo.StringBuilder();
            let lastSaid = result.lastSaid;
            let lastAction = result.lastAction;

            // See if there has been anything said by the user, append to buffer if so
            if (
                _.isObject(lastSaid) &&
                !_.isEmpty(lastSaid)
            ) {
                if (!iteration) output.insertBold(lastSaid.from).insert('Saying');
                else output.insert('Then saying');
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
                        output.insert('Changing their nick to').insertBold(lastAction.newnick)
                            .insert('on').insertBold(`[${lastAction.channels.replace(',', ', ')}]`)
                            .insert(Moment(lastAction.timestamp).fromNow());

                        // First result to channel, any chains elsewhere
                        if (iteration === 0 && from !== to) output.insertDivider().append(`additional results have been messaged to you ${from}`);

                        // Recurse
                        seen(to, from, `${lastAction.newnick || ''}!${lastAction.user || ''}@${lastAction.host || ''} ${lastSaid.to || lastAction.channel || ''}`, message, iteration + 1, descending);
                        break;
                    case 'aliasNew':
                        output.insert('Changing their nick from').insertBold(lastAction.oldnick)
                            .insert('on').insertBold(`[${lastAction.channels.replace(',', ', ')}]`)
                            .insert(Moment(lastAction.timestamp).fromNow());
                        break;
                    case 'topic':
                        output.insert(`Changing the topic in`)
                            .insertBold(lastAction.channel)
                            .insert(Moment(lastAction.timestamp).fromNow());
                        break;
                }
            }

            // Begin the Line
            if (iteration === 0 && !_.isEmpty(output.text)) output.prepend(iteration === 0 ? `Seen` : '|');

            // report back to IRC
            app.say(iteration === 0 ? to : from, !_.isEmpty(output.text) ? output.text : `Something went wrong finding the active state for ${result.args.nick || result.args.user || result.args.host}, ${from}`);
        };

        try {
            const result = await gen(text, {descending});
            sendToIRC(result);
        }
        catch (err) {
            logger.error('Error in the last active Promise.all chain', {
                err: err.stack || 'No stack available'
            });
            app.say(to, `Something went wrong finding the active state for ${err.args.nick || err.args.user || err.args.host || text}, ${from} [${err.inner.message || ''}]`);
        }
    };

    // Command
    app.Commands.set('seen', {
        desc: '[nick!user@host channel] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: seen
    });

    // Command
    app.Commands.set('first-seen', {
        desc: '[nick!user@host channel] shows the first activity of the user',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => seen(to, from, text, message, 0, false)
    });

    // Return the script info
    return scriptInfo;
};
