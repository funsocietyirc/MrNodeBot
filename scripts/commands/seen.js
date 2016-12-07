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

// Exports
module.exports = app => {
    // If we have Database availability
    if (!Models.Logging || !Models.JoinLogging || !Models.PartLogging || !Models.QuitLogging || !Models.KickLogging || !Models.Alias) return scriptInfo;

    // Show activity of given hostmask
    const seen = (to, from, text, message, iteration = 0) => {
        // Normalize Iteration
        iteration = _.isSafeInteger(iteration) && iteration >= 0 ? iteration : 0;

        // Extract user information
        let args = extract(text);

        // Grab user
        let nick = args.nick;
        let user = args.user;
        let host = args.host;
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

        // Tabulate data, send back to IRC
        const processResults = results => {
            // Clean results that are falsey / undefined
            results = _.compact(results);
            // No Data available for user
            if (!_.isArray(results) || _.isEmpty(results)) {
                app.say(to, `I have no data on ${nick || user || host}`);
                return;
            }

            // Hold the output
            let output = new typo.StringBuilder();
            // Begin the Line
            if (!iteration)
                output.insert(`Seen`);

            // See if there has been anything said by the user, append to buffer if so
            let lastSaid = _(results).map('log').compact().first();
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

            // Get the most recent result
            let lastResult = _(results).maxBy(value => Moment(value[Object.keys(value)[0]].timestamp).unix());

            // Check other activity
            if (lastResult.part) {
                output.insert('Parting')
                    .insertBold(lastResult.part.channel)
                    .insert(Moment(lastResult.part.timestamp).fromNow());
                if (lastResult.part.nick != lastSaid.from) output.insert('as').insertBold(lastResult.part.nick);
                output.appendBold(lastResult.part.reason);
            } else if (lastResult.quit) {
                output.insert('Quitting').insertBold(!_.isEmpty(lastResult.quit.channels) ? `[${lastResult.quit.channels.replace(',',', ')}]` : 'on');
                output.insert(Moment(lastResult.quit.timestamp).fromNow());
                if (lastResult.quit.nick != lastSaid.from) output.insert('as').insertBold(lastResult.quit.nick);
                output.insert(lastResult.quit.reason);
            } else if (lastResult.kick) {
                output.insert('Getting kicked from')
                    .insertBold(lastResult.kick.channel)
                    .insert(lastResult.kick.timestamp);
                if (lastResult.kick.nick != lastSaid.from) output.insert('as').insertBold(lastResult.quit.nick);
                output.insert(lastResult.kick.reason);
            } else if (lastResult.join) {
                output.insert('Joining')
                    .insertBold(lastResult.join.channel)
                    .insert(Moment(lastResult.join.timestamp).fromNow());
                if (lastResult.kick.nick != lastSaid.from) output.insert('as').insertBold(lastResult.quit.nick);

            } else if (lastResult.aliasOld) {
                output.insert('Changing their nick to').insertBold(lastResult.aliasOld.newnick);
                output.insert('on').insertBold(`[${lastResult.aliasOld.channels.replace(',',', ')}]`);
                output.insert(Moment(lastResult.aliasOld.timestamp).fromNow());
                // The last action commited by the user was a nick change, recurse and follow the next nick in the chain
            }
            // else if (lastResult.aliasNew) {
            //     //output.insert('Changing their nick from').insertBold(lastResult.aliasNew)
            //     output.append(`changing their nick to ${lastResult.aliasNew.newnick} from ${lastResult.aliasNew.oldnick} in [${lastResult.aliasNew.channels}] ${Moment(lastResult.aliasNew.timestamp).fromNow()}`);
            // }

            // Respond
            if (lastResult.aliasOld && iteration < 2) seen(to, from, `${lastResult.aliasOld.newnick}*${lastResult.aliasOld.user}@${lastResult.aliasOld.host}`, message, iteration + 1);
            else if (lastResult.aliasOld) output.insertDivider().appendBold(`Chain exceeds max limit`);

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
            .then(processResults)
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
