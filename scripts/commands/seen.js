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

module.exports = app => {

    // If we have Database availability
    if (!Models.Logging || !Models.JoinLogging || !Models.PartLogging || !Models.QuitLogging || !Models.KickLogging || !Models.Alias) return scriptInfo;

    /**
        Show the last known activity of a given username
    **/
    const seen = (to, from, text, message) => {
        // Grab user
        let [user] = text.split(' ');

        // We have no user
        if (!user) {
            app.say(to, 'you must specify a user');
            return;
        }
        // Someone is trying to get the activity of the bot
        if (app._ircClient.isBotNick(user)) {
            app.say(to, `I am always active ${from}, always...`);
            return;
        }

        //1 Grab Logging Data
        let logging = Models.Logging.query(qb => qb
            .select('to', 'from', 'text', 'timestamp')
            .where('from', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
            if (!result) return;
            return new Object({
                log: result.toJSON()
            });
        });
        // Grab Join Data
        let joinLogging = Models.JoinLogging.query(qb => qb
            .select('nick', 'channel', 'timestamp')
            .where('nick', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
            if (!result) return;
            return new Object({
                join: result.toJSON()
            });
        });
        // Grab Part Logging Data
        let partLogging = Models.PartLogging.query(qb => qb
            .select('nick', 'channel', 'reason', 'timestamp')
            .where('nick', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
            if (!result) return;
            return new Object({
                part: result.toJSON()
            });
        });
        // Gran Quit Logging Data
        let quitLogging = Models.QuitLogging.query(qb => qb
            .select('nick', 'channels', 'reason', 'timestamp')
            .where('nick', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
            if (!result) return;
            return new Object({
                quit: result.toJSON()
            });
        });
        // Grab Kick Logging Data
        let kickLogging = Models.KickLogging.query(qb => qb
            .select('nick', 'channel', 'reason', 'timestamp')
            .where('nick', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
            if (!result) return;
            return new Object({
                kick: result.toJSON()
            });
        });
        // Grab Nick Change notices (old)
        let aliasOld = Models.Alias.query(qb => qb
            .select('oldnick', 'newnick', 'channels', 'timestamp')
            .where('oldnick', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
            if (!result) return;
            return new Object({
                aliasOld: result.toJSON()
            });
        });
        // Grab Nick Change notices (old)
        let aliasNew = Models.Alias.query(qb => qb
            .select('oldnick', 'newnick', 'channels', 'timestamp')
            .where('newnick', user)
            .orderBy('timestamp', 'desc')
            .limit(1)).fetch().then(result => {
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
                    app.say(to, `I have no data on ${user}`);
                    return;
                }

                // Hold the output
                let output = new typo.StringBuilder();
                output.append('Seen');

                // Check the last thing said
                let lastSaid = _(results).map('log').compact().first();
                if (lastSaid)
                    output.append(lastSaid.from).append(`saying ${lastSaid.text}`).append(`on ${lastSaid.to} ${Moment(lastSaid.timestamp).fromNow()}`);

                // Get the most recent result
                let lastResult = _(results).maxBy(value => Moment(value[Object.keys(value)[0]].timestamp).unix());

                // Check other activity
                if (lastResult.part)
                    output.append(`parting ${lastResult.part.channel} ${Moment(lastResult.part.timestamp).fromNow()}`).append(lastResult.part.reason);
                else if (lastResult.quit)
                    output.append(`quitting [${lastResult.quit.channels ? lastResult.quit.channels.replace(',', ', ') : ''}] ${Moment(lastResult.quit.timestamp).fromNow()}`).append(lastResult.quit.reason);
                else if (lastResult.kick)
                    output.append(`getting kicked from ${lastResult.kick.channel} ${Moment(lastResult.kick.timestamp).fromNow()}`).append(lastResult.kick.reason);
                else if (lastResult.join)
                    output.append(`joining ${lastResult.join.channel} ${Moment(lastResult.join.timestamp).fromNow()}`);
                else if (lastResult.aliasOld) {
                    output.append(`changing their nick to ${lastResult.aliasOld.newnick} in [${lastResult.aliasOld.channels}] ${Moment(lastResult.aliasOld.timestamp).fromNow()}`);
                    // Recurse on nick change
                    seen(to, from, lastResult.aliasOld.newnick, message);
                } else if (lastResult.aliasNew)
                    output.append(`changing their nick from ${lastResult.aliasNew.oldnick} in [${lastResult.aliasNew.channels}] ${Moment(lastResult.aliasNew.timestamp).fromNow()}`);

                // For Some reason our output is empty
                if (_.isEmpty(output.text)) {
                    app.say(to, `Something went wrong finding the active state for ${user}, ${from}`);
                    return;
                }
                app.say(to, output.text);
            })
            .catch(err => {
                logger.error('Error in the last active Promise.all chain', {
                    err
                });
                app.say(to, `Something went wrong finding the active state for ${user}, ${from}`);
            });
    };

    // Command
    app.Commands.set('seen', {
        desc: '[user] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: seen
    });

    // Return the script info
    return scriptInfo;
};
