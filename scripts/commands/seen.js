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
    const seen = (to, from, text, message) => {
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

        // Resolve all promises
        Promise.all([
                Models.Logging.query(qb => filter(qb, 'from', 'ident')).fetch().then(result => render(result, 'log')),
                Models.JoinLogging.query(filter).fetch().then(result => render(result, 'join')),
                Models.PartLogging.query(filter).fetch().then(result => render(result, 'part')),
                Models.QuitLogging.query(filter).fetch().then(result => render(result, 'quit')),
                Models.KickLogging.query(filter).fetch().then(result => render(result, 'kick')),
                Models.Alias.query(qb => filter(qb, 'oldnick')).fetch().then(result => render(result, 'aliasOld')),
                Models.Alias.query(qb => filter(qb, 'newnick')).fetch().then(result => render(result, 'aliasNew')),
            ])
            .then(results => {
                // Clean results that are falsey / undefined
                results = _.compact(results);
                // No Data available for user
                if (!_.isArray(results) || _.isEmpty(results)) {
                    app.say(from, `I have no data on ${nick || user || host}`);
                    return;
                }

                // Hold the output
                let output = new typo.StringBuilder();
                // Begin the Line
                output.appendBold(`Seen`);

                // See if there has been anything said by the user, append to buffer if so
                let lastSaid = _(results).map('log').compact().first();
                if (lastSaid) output.append().append(`${lastSaid.from} saying`).append(`${lastSaid.text}`).append(`on ${lastSaid.to} ${Moment(lastSaid.timestamp).fromNow()}`);

                // Get the most recent result
                let lastResult = _(results).maxBy(value => Moment(value[Object.keys(value)[0]].timestamp).unix());

                // Check other activity
                if (lastResult.part)
                    output.append(`parting ${lastResult.part.channel} ${Moment(lastResult.part.timestamp).fromNow()}`).append(`as ${lastResult.part.nick}`).append(lastResult.part.reason);
                else if (lastResult.quit)
                    output.append(`quitting [${lastResult.quit.channels}] ${Moment(lastResult.quit.timestamp).fromNow()}`).append(`as ${lastResult.quit.nick}`).append(lastResult.quit.reason);
                else if (lastResult.kick)
                    output.append(`getting kicked from ${lastResult.kick.channel} ${Moment(lastResult.kick.timestamp).fromNow()}`).append(`as ${lastResult.kick.nick}`).append(lastResult.kick.reason);
                else if (lastResult.join)
                    output.append(`joining ${lastResult.join.channel} ${Moment(lastResult.join.timestamp).fromNow()}`).append(`as ${lastResult.join.nick}`);
                else if (lastResult.aliasOld) {
                    output.append(`changing their nick from ${lastResult.aliasOld.oldnick} to ${lastResult.aliasOld.newnick} in [${lastResult.aliasOld.channels}] ${Moment(lastResult.aliasOld.timestamp).fromNow()}`);
                    // Recurse
                    seen(to, from, `${lastResult.aliasOld.newnick}*${lastResult.aliasOld.user}@${lastResult.aliasOld.host}`, message);
                } else if (lastResult.aliasNew)
                    output.append(`changing their nick to ${lastResult.aliasNew.newnick} from ${lastResult.aliasNew.oldnick} in [${lastResult.aliasNew.channels}] ${Moment(lastResult.aliasNew.timestamp).fromNow()}`);

                // Respond
                app.say(from, !_.isEmpty(output.text) ? output.text : `Something went wrong finding the active state for ${nick || user || host}, ${from}`);
            })
            .catch(err => {
                console.dir(err);
                logger.error('Error in the last active Promise.all chain', {
                    err
                });
                app.say(from, `Something went wrong finding the active state for ${nick || user || host}, ${from}`);
            });
    };

    // Command
    app.Commands.set('seen', {
        desc: '[nick*user@host] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            if (from !== to) app.say(to, `I have private messaged you the results ${from}`);
            seen(to, from, text, message);
        }
    });

    // Return the script info
    return scriptInfo;
};
