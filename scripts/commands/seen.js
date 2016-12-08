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
const extract = require('../../lib/extractNickUserIdent');
const gen = require('../generators/_getLastUsageData');
// Exports
module.exports = app => {
    // If we have Database availability
    if (!Models.Logging || !Models.JoinLogging || !Models.PartLogging || !Models.QuitLogging || !Models.KickLogging || !Models.Alias) return scriptInfo;

    // Show activity of given hostmask
    const seen = (to, from, text, message, iteration = 0) => {
        // Normalize Iteration, this is used to chain
        iteration = _.isSafeInteger(iteration) && iteration >= 0 ? iteration : 0;

        // Extract user information
        let args = extract(text);

        // Grab user
        let nick = args.nick;
        let user = args.user;
        let host = args.host;

        // GATES

        // We have no user
        if (!nick && !user && !host) {
            app.say(to, `You need to give me something to work with ${from}`);
            return;
        }

        // Someone is trying to get the activity of the bot
        if (app._ircClient.isBotNick(nick)) {
            app.say(to, `I am always active ${from}, always...`);
            return;
        }

        // END GATES

        // Query filter
        const filter = (qb, nickField = 'nick', userField = 'user') => {
            if (nick) qb.andWhere(nickField, 'like', nick);
            if (user) qb.andWhere(userField, 'like', user);
            if (host) qb.andWhere('host', 'like', host);
            return qb.orderBy('timestamp', 'desc').limit(1);
        };

        // Render object
        const render = (result, key) => {
            if (!result || !key) return;
            let output = Object.create(null);
            output[key] = result.toJSON();
            return output;
        };

        // Tabulate results
        const tabulateResults = results => {
            // Invalid Results
            if (!_.isArray(results) || _.isEmpty(results)) return [];
            // Remove undefined / falsey values
            results = _.compact(results);
            return {
                finalResults: results,  // Filtered version of total results
                lastSaid:_(results).map('log').compact().first(), // Last Said information
                lastAction: _(results).maxBy(value => Moment(value[Object.keys(value)[0]].timestamp).unix()) // Last Action information
            };
        };

        // Send to IRC
        const sendToIRC = results => {
            // No Data available for user
            if (_.isEmpty(results) || _.isEmpty(results.finalResults)) {
                app.say(to, `I have no data on ${nick || user || host}`);
                return;
            }

            // Hold the output
            let output = new typo.StringBuilder();
            let lastSaid = results.lastSaid;
            let lastAction = results.lastAction;

            // Begin the Line
            if (!iteration)
                output.insert(`Seen`);


            // See if there has been anything said by the user, append to buffer if so
            if (lastSaid) {
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
                if (lastAction.part.nick != lastSaid.from) output.insert('as').insertBold(lastAction.part.nick);
                output.appendBold(lastAction.part.reason);
            } else if (lastAction.quit) {
                output.insert('Quitting').insertBold(!_.isEmpty(lastAction.quit.channels) ? `[${lastAction.quit.channels.replace(',',', ')}]` : 'on');
                output.insert(Moment(lastAction.quit.timestamp).fromNow());
                if (lastAction.quit.nick != lastSaid.from) output.insert('as').insertBold(lastAction.quit.nick);
                output.insert(lastAction.quit.reason);
            } else if (lastAction.kick) {
                output.insert('Getting kicked from')
                    .insertBold(lastAction.kick.channel)
                    .insert(lastAction.kick.timestamp);
                if (lastAction.kick.nick != lastSaid.from) output.insert('as').insertBold(lastAction.quit.nick);
                output.insert(lastAction.kick.reason);
            } else if (lastAction.join) {
                output.insert('Joining')
                    .insertBold(lastAction.join.channel)
                    .insert(Moment(lastAction.join.timestamp).fromNow());
                if (lastAction.kick.nick != lastSaid.from) output.insert('as').insertBold(lastAction.quit.nick);

            } else if (lastAction.aliasOld) {
                output.insert('Changing their nick to').insertBold(lastAction.aliasOld.newnick);
                output.insert('on').insertBold(`[${lastAction.aliasOld.channels.replace(',',', ')}]`);
                output.insert(Moment(lastAction.aliasOld.timestamp).fromNow());
                // The last action commited by the user was a nick change, recurse and follow the next nick in the chain
            }
            // else if (lastAction.aliasNew) {
            //     //output.insert('Changing their nick from').insertBold(lastAction.aliasNew)
            //     output.append(`changing their nick to ${lastAction.aliasNew.newnick} from ${lastAction.aliasNew.oldnick} in [${lastAction.aliasNew.channels}] ${Moment(lastAction.aliasNew.timestamp).fromNow()}`);
            // }

            // Respond
            if (lastAction.aliasOld && iteration < 1) seen(to, from, `${lastAction.aliasOld.newnick}*${lastAction.aliasOld.user}@${lastAction.aliasOld.host}`, message, iteration + 1);
            else if (lastAction.aliasOld) output.insertDivider().appendBold(`Chain exceeds max limit`);

            app.say(to, !_.isEmpty(output.text) ? output.text : `Something went wrong finding the active state for ${nick || user || host}, ${from}`);
        };

        // Resolve all the queries, process the results, report any errors
        Promise.all([
                Models.Logging.query(qb => filter(qb, 'from', 'ident')).fetch().then(result => render(result, 'log')),
                Models.JoinLogging.query(filter).fetch().then(result => render(result, 'join')),
                Models.PartLogging.query(filter).fetch().then(result => render(result, 'part')),
                Models.QuitLogging.query(filter).fetch().then(result => render(result, 'quit')),
                Models.KickLogging.query(filter).fetch().then(result => render(result, 'kick')),
                Models.Alias.query(qb => filter(qb, 'oldnick')).fetch().then(result => render(result, 'aliasOld')),
                // Models.Alias.query(qb => filter(qb, 'newnick')).fetch().then(result => render(result, 'aliasNew')),
            ])
            .then(tabulateResults)
            .then(sendToIRC)
            .catch(err => {
                console.dir(err);
                logger.error('Error in the last active Promise.all chain', {
                    err
                });
                app.say(to, `Something went wrong finding the active state for ${nick || user || host}, ${from}`);
            });
    };

    // Command
    app.Commands.set('seen', {
        desc: '[nick*user@host] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: seen
    });

    // Return the script info
    return scriptInfo;
};
