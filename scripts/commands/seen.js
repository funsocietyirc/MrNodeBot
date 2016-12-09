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
    // If we have Database availability
    if (!Models.Logging || !Models.JoinLogging || !Models.PartLogging || !Models.QuitLogging || !Models.KickLogging || !Models.Alias) return scriptInfo;

    // Show activity of given hostmask
    const seen = (to, from, text, message, iteration = 0) => {
        // Gate
        if (!_.isString(text) || _.isEmpty(text)) {
            app.say(to, `I need someone to look for ${from}`);
            return;
        }

        // Normalize Iteration, this is used to chain
        iteration = _.isSafeInteger(iteration) && iteration >= 0 ? iteration : 0;

        // Send to IRC
        const sendToIRC = result => {
            console.dir(result)
                // No Data available for user
            if (_.isEmpty(result) || _.isEmpty(result.finalResults)) {
                app.say(to, `I have no data on ${result.args.nick || result.args.user ||result.args.host}`);
                return;
            }

            // Hold the output
            let output = new typo.StringBuilder();
            let lastSaid = result.lastSaid;
            let lastAction = result.lastAction;

            // Begin the Line
            if (iteration === 0) output.insert(`Seen`);

            // See if there has been anything said by the user, append to buffer if so
            if (!_.isUndefined(lastSaid) && _.isObject(lastSaid) || !_.isEmpty(lastSaid)) {
                if (!iteration) output.insertBold(lastSaid.from).insert('Saying');
                else output.insert('| Then saying');
                output
                    .insertBold(lastSaid.text)
                    .insert('on')
                    .insertBold(lastSaid.to)
                    .insert(Moment(lastSaid.timestamp).fromNow())
                    .insertDivider();
            }

            // Check other activity
            if (lastAction.part) {
                output.insert('Parting')
                    .insertBold(lastAction.part.channel)
                    .insert(Moment(lastAction.part.timestamp).fromNow());
                if (!lastSaid || lastAction.part.nick != lastSaid.from) output.insert('as').insertBold(lastAction.part.nick);
                output.appendBold(lastAction.part.reason);
            } else if (lastAction.quit) {
                output.insert('Quitting').insertBold(!_.isEmpty(lastAction.quit.channels) ? `[${lastAction.quit.channels.replace(',',', ')}]` : 'on');
                output.insert(Moment(lastAction.quit.timestamp).fromNow());
                if (!lastSaid || lastAction.quit.nick != lastSaid.from) output.insert('as').insertBold(lastAction.quit.nick);
                output.insert(lastAction.quit.reason);
            } else if (lastAction.kick) {
                output.insert('Getting kicked from')
                    .insertBold(lastAction.kick.channel)
                    .insert(lastAction.kick.timestamp);
                if (!lastSaid || lastAction.kick.nick != lastSaid.from) output.insert('as').insertBold(lastAction.quit.nick);
                output.insert(lastAction.kick.reason);
            } else if (lastAction.join) {
                output.insert('Joining')
                    .insertBold(lastAction.join.channel)
                    .insert(Moment(lastAction.join.timestamp).fromNow());
                if (!lastSaid || lastAction.join.nick != lastSaid.from) output.insert('as').insertBold(lastAction.join.nick);

            } else if (lastAction.aliasOld) {
                output.insert('Changing their nick to').insertBold(lastAction.aliasOld.newnick)
                    .insert('on').insertBold(`[${lastAction.aliasOld.channels.replace(',',', ')}]`)
                    .insert(Moment(lastAction.aliasOld.timestamp).fromNow());
                // The last action commited by the user was a nick change, recurse and follow the next nick in the chain
            } else if (lastAction.aliasNew) {
                output.append('Changing their nick from').insertBold(lastAction.aliasNew.oldnick)
                    .insert('on').insertBold(`[${lastAction.aliasNew.channels.replace(',',', ')}]`)
                    .insert(Moment(lastAction.aliasNew.timestamp).fromNow());
            }

            // First result to channel, any chains elsewhere
            if (iteration === 0 && lastAction.aliasOld && from !== to) output.insertDivider().append(`additional results have been messaged to you ${from}`);
            app.say(iteration === 0 ? to : from, !_.isEmpty(output.text) ? output.text : `Something went wrong finding the active state for ${args.nick || args.user ||args.host}, ${from}`);

            // Recurse
            if (lastAction.aliasOld) seen(to, from, `${lastAction.aliasOld.newnick}!${lastAction.aliasOld.user}@${lastAction.aliasOld.host}`, message, iteration + 1);
        };

        gen(text)
            .then(sendToIRC)
            .catch(err => {
                console.dir(err)
                logger.error('Error in the last active Promise.all chain', {
                    err
                });
                app.say(to, `Something went wrong finding the active state for ${err.args.nick || err.args.user || err.args.host || text}, ${from} [${err.inner.message || ''}]`);
            });
    };

    // Command
    app.Commands.set('seen', {
        desc: '[nick!user@host] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: seen
    });

    // Return the script info
    return scriptInfo;
};
