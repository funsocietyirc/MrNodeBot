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

        Promise.all([logging, partLogging, quitLogging, kickLogging])
            .then(results => {
                // Clean result
                results = _.compact(results);
                // No Data available for user
                if (!_.isArray(results) || _.isEmpty(results)) {
                    app.say(to, `I have no data on ${user}`);
                    return;
                }
                // Get the most recent result
                results = _(results).sortBy(value => new Moment(value.timestamp).unix()).first();

                // The last information we have was a post
                if (results.log)
                    app.say(to, `${results.log.from} was last active ${Moment(results.log.timestamp).fromNow()} on ${results.log.to} Saying: ${results.log.text}`);
                else if (results.part)
                    app.say(to, `${results.part.nick} was last active ${Moment(results.part.timestamp).fromNow()} on ${results.part.channel} Parting: ${results.part.reason}`);
                else if (results.quit)
                    app.say(to, `${results.quit.nick} was last active ${Moment(results.quit.timestamp).fromNow()} on ${results.kick.channels} Quitting: ${results.quit.reason}`);
                else if (results.kick)
                    app.say(to, `${results.kick.nick} was last active ${Moment(results.kick.timestamp).fromNow()} on ${results.kick.channel} Getting Kicked: ${results.kick.reason}`);

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
