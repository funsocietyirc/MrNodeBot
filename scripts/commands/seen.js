'use strict';
const scriptInfo = {
    name: 'Seen',
    desc: 'Get stats on the last activity of a IRC user',
    createdBy: 'IronY'
};

const _ = require('lodash');
const Moment = require('moment');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const extract = require('../../lib/extractNickUserIdent');

module.exports = app => {

    // If we have Database availability
    if (!Models.Logging || !Models.JoinLogging || !Models.PartLogging || !Models.QuitLogging || !Models.KickLogging || !Models.Alias) return scriptInfo;

    /**
        Show the last known activity of a given username
    **/
    const seen = (to, from, text, message) => {
        // Extract user information
        let args = extract(text);
        console.dir(args);
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

        //Grab Logging Data
        let logging = Models.Logging.query(qb => {
            if (nick) qb.andWhere('from', nick);
            if (user) qb.andWhere('ident', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1);
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                log: result.toJSON()
            });
        });

        // Grab Join Data
        let joinLogging = Models.JoinLogging.query(qb => {
            if (nick) qb.andWhere('nick', nick);
            if (user) qb.andWhere('user', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1);
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                join: result.toJSON()
            });
        });

        // Grab Part Logging Data
        let partLogging = Models.PartLogging.query(qb => {
            if (nick) qb.andWhere('nick', nick);
            if (user) qb.andWhere('user', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1)
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                part: result.toJSON()
            });
        });

        // Gran Quit Logging Data
        let quitLogging = Models.QuitLogging.query(qb => {
            if (nick) qb.andWhere('nick', nick);
            if (user) qb.andWhere('user', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1)
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                quit: result.toJSON()
            });
        });

        // Grab Kick Logging Data
        let kickLogging = Models.KickLogging.query(qb => {
            if (nick) qb.andWhere('nick', nick);
            if (user) qb.andWhere('user', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1)
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                kick: result.toJSON()
            });
        });

        // Grab Nick Change notices (old)
        let aliasOld = Models.Alias.query(qb => {
            qb.select();
            if (nick) qb.andWhere('oldnick', nick);
            if (user) qb.andWhere('user', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1)
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                aliasOld: result.toJSON()
            });
        });

        // Grab Nick Change notices (old)
        let aliasNew = Models.Alias.query(qb => {
            qb.select();
            if (nick) qb.andWhere('oldnick', nick);
            if (user) qb.andWhere('user', user);
            if (host) qb.andWhere('host', host);
            qb.orderBy('timestamp', 'desc').limit(1)
        }).fetch().then(result => {
            if (!result) return;
            return new Object({
                aliasNew: result.toJSON()
            });
        });

        // Resolve all promises
        Promise.all([logging, partLogging, quitLogging, kickLogging, joinLogging, aliasOld, aliasNew])
            .then(results => {
                // Clean results that are falsey / undefined
                results = _.compact(results);
                // No Data available for user
                if (!_.isArray(results) || _.isEmpty(results)) {
                    app.say(to, `I have no data on ${nick || user || host}`);
                    return;
                }

                // Hold the output
                let output = new typo.StringBuilder();
                output.appendBold(`Seen`);

                // Check the last thing said
                let lastSaid = _(results).map('log').compact().first();

                if (lastSaid) output.append().append(`${lastSaid.from} saying`).append(`${lastSaid.text}`).append(`on ${lastSaid.to} ${Moment(lastSaid.timestamp).fromNow()}`);

                // Get the most recent result
                let lastResult = _(results).maxBy(value => Moment(value[Object.keys(value)[0]].timestamp).unix());


                // Check other activity
                if (lastResult.part) {
                    if (!lastSaid) output.append(lastResult.part.nick);
                    output.append(`parting ${lastResult.part.channel} ${Moment(lastResult.part.timestamp).fromNow()}`).append(lastResult.part.reason);
                } else if (lastResult.quit) {
                    if (!lastSaid) output.append(lastResult.quit.nick);
                    output.append(`quitting [${lastResult.quit.channels}] ${Moment(lastResult.quit.timestamp).fromNow()}`).append(lastResult.quit.reason);
                } else if (lastResult.kick) {
                    if (!lastSaid) output.append(lastResult.kick.nick);
                    output.append(`getting kicked from ${lastResult.kick.channel} ${Moment(lastResult.kick.timestamp).fromNow()}`).append(lastResult.kick.reason);
                } else if (lastResult.join) {
                    if (!lastSaid) output.append(lastResult.join.nick);
                    output.append(`joining ${lastResult.join.channel} ${Moment(lastResult.join.timestamp).fromNow()}`);
                } else if (lastResult.aliasOld) {
                    if (!lastSaid) output.append(lastResult.aliasold.oldnick);
                    output.append(`changing their nick to ${lastResult.aliasOld.newnick} in [${lastResult.aliasOld.channels}] ${Moment(lastResult.aliasOld.timestamp).fromNow()}`);
                    // Recurse on nick change
                    // TODO Fix
                    // seen(to, from, `${lastResult.aliasOld.newnick}*${lastResult.aliasOld.user}@${lastResult.aliasOld.host}`, message);
                } else if (lastResult.aliasNew) {
                    if (!lastSaid) output.append(lastResult.aliasNew.newnick);
                    output.append(`changing their nick from ${lastResult.aliasNew.oldnick} in [${lastResult.aliasNew.channels}] ${Moment(lastResult.aliasNew.timestamp).fromNow()}`);
                }

                // For Some reason our output is empty
                if (_.isEmpty(output.text)) {
                    app.say(to, `Something went wrong finding the active state for ${nick}, ${from}`);
                    return;
                }
                app.say(to, output.text);
            })
            .catch(err => {
                logger.error('Error in the last active Promise.all chain', {
                    err
                });
                app.say(to, `Something went wrong finding the active state for ${nick}, ${from}`);
            });
    };

    // Command
    app.Commands.set('seen', {
        desc: '[nick*user@hot] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: seen
    });

    // Return the script info
    return scriptInfo;
};
