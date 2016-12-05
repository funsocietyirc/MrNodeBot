'use strict';
const scriptInfo = {
    name: 'lastActive',
    desc: 'Get stats on the last activity of a IRC user',
    createdBy: 'IronY'
};

const _ = require('lodash');
const Moment = require('moment');
const Models = require('bookshelf-model-loader');

module.exports = app => {

    // If we have Database availability
    if (!Models.Logging) return scriptInfo;

    /**
        Show the last known activity of a given username
    **/
    const lastActive = (to, from, text, message) => {
        // Grab user
        let [user] = text.split(' ');

        // We have no user
        if (!user) {
            app.say(to, 'you must specify a user');
            return;
        }
        // Grab Logging Data
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
            .select('oldnick', 'newnick', 'channels','timestamp')
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
            .select('oldnick', 'newnick', 'channels','timestamp')
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
                // Get the most recent result
                results = _(results).maxBy(value => Moment(value[Object.keys(value)[0]].timestamp).unix());

                // Report based on the result we got back
                if (results.log)
                    app.say(to, `${results.log.from} was last active ${Moment(results.log.timestamp).fromNow()} on ${results.log.to} Saying: ${results.log.text}`);
                else if (results.part)
                    app.say(to, `${results.part.nick} was last active ${Moment(results.part.timestamp).fromNow()} on ${results.part.channel} Parting: ${results.part.reason || 'No reason given'}`);
                else if (results.quit)
                    app.say(to, `${results.quit.nick} was last active ${Moment(results.quit.timestamp).fromNow()} on ${results.quit.channels} Quitting: ${results.quit.reason || 'No reason given'}`);
                else if (results.kick)
                    app.say(to, `${results.kick.nick} was last active ${Moment(results.kick.timestamp).fromNow()} on ${results.kick.channel} Getting Kicked: ${results.kick.reason || 'No reason given'}`);
                else if (results.join)
                    app.say(to, `${results.join.nick} was last active ${Moment(results.join.timestamp).fromNow()} on ${results.join.channel} Joining`);
                else if (results.aliasOld)
                    app.say(to, `${results.aliasOld.oldnick} was last active ${Moment(results.aliasOld.timestamp).fromNow()} on ${results.aliasOld.channels} Changing Nick to ${results.aliasOld.newnick}`);
                else if (results.aliasNew)
                    app.say(to, `${results.aliasNew.newnick} was last active ${Moment(results.aliasNew.timestamp).fromNow()} on ${results.aliasNew.channels} Changing Nick from ${results.aliasNew.oldnick}`);

            })
            .catch(err => {
                logger.error('Error in the last active Promise.all chain', {
                    err
                });
                app.say(to, `Something went wrong finding the activing state for ${user}, ${from}`);
            });
    };

    // Command
    app.Commands.set('last-active', {
        desc: '[user] shows the last activity of the user',
        access: app.Config.accessLevels.identified,
        call: lastActive
    });

    // Return the script info
    return scriptInfo;
};
