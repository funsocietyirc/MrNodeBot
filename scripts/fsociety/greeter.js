'use strict';
// TODO: Make multi-channel and configurable
const scriptInfo = {
    name: 'greeter',
    desc: 'Send a message to users joining mr robot sub channels based on certain conditions, ' +
    'letting them know and inviting them to #fsociety',
    createdBy: 'IronY'
};
const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = app => {
    // More readable inline leet speak
    const l33t = text => text
        .replace(/[a]/gi, '4')
        .replace(/[b]/gi, '6')
        .replace(/[e]/gi, '3')
        .replace(/[s]/gi, '$')
        .replace(/[i]/gi, '1')
        .replace(/[t]/gi, '7')
        .replace(/[o]/gi, '0');

    // Do not load module if we have no database
    if (!app.Database && !Models.Greeter) return;

    const salutations = _.map([
        'Greetings', 'Hail', 'Welcome', 'Salutations', 'Alhoa',
        'Howdy', 'Hi', 'Hey', 'Hiya', 'Good Day', 'Yo', 'How are you', 'Salute', 'What\'s up', 'Bonsoir'
    ], l33t).join('|');

    const appends = _.map([
        'hello friend', 'it\'s happening', 'what are your instructions', 'I saved a chair for you'
    ], l33t).join('|');

    // Model
    const greetModel = Models.Greeter;

    // Check DB to see if they were already greeted
    const checkChannel = (channel, nick, host, callback) => greetModel.query(qb => qb.where(clause => {
        clause
            .where('channel', 'like', channel)
            .where('nick', 'like', nick)
    }).orWhere(clause => {
        clause
            .where('channel', 'like', channel)
            .where('host', 'like', host)
    }))
        .fetch()
        .then(results => {
            if (results) return;
            // Log that we have greeted for this channel
            greetModel.create({
                channel: channel,
                nick: nick,
                host: host
            })
                .catch(err => logger.error('Error in greeter', {
                    err
                }));

            if (_.isFunction(callback)) callback();
        });

    const mainChannel = app.Config.features.fsociety.mainChannel.toLowerCase();

    // Provide a onJoin handler
    const onJoin = (channel, nick, message) => {
        let lowerCaseChannel = channel.toLowerCase();
        // Make sure we are not reporting ourselves
        if (
            nick !== app.nick &&
            lowerCaseChannel !== mainChannel &&
            !_.includes(app.Config.features.fsociety.greetIgnore, lowerCaseChannel) &&
            !app._ircClient.isInChannel(app.Config.features.fsociety.mainChannel, nick)
        ) {
            checkChannel(channel, nick, message.host, () => {
                if (app.Config.features.fsociety.report) app.say(app.Config.owner.nick, `${nick} joined the Dark Army Channel:  ${channel}`);
                setTimeout(() => {
                    app.say(nick, `{${salutations}} ${nick}, {${appends}}. The time is now, ${app.Config.features.fsociety.mainChannel} needs your help. Joins us.`);
                    app._ircClient.send('invite', nick, app.Config.features.fsociety.mainChannel);
                }, app.Config.features.fsociety.greeterDealy * 1000);
            });
        }
    };
    app.OnJoin.set('fsociety-greeter', {
        call: onJoin,
        name: 'fsociety-greetr'
    });

    //Clear greet cache
    const cleanGreetDb = (to, from, text, message) => {
        let textArray = text.split(' ');
        if (!textArray.length) {
            app.say(to, 'You must specify a channel when clearing the greeter cache');
            return;
        }
        let [channel] = textArray;
        greetModel
            .where('channel', 'like', channel)
            .destroy()
            .then(() => app.say(to, `Greet cache has been cleared for ${channel}`))
            .catch(err => {
                app.say(to, `Something went wrong clearing the greet cache for ${channel}`);
                logger.error('Error in greet cache clear command', {
                    err
                });
            });
    };
    app.Commands.set('greet-clear-channel', {
        desc: 'greet-clear-channel [channel] - Clear the greet cache for  the specified channel',
        access: app.Config.accessLevels.owner,
        call: cleanGreetDb
    });

    // Get total greets by channel
    const getTotalGreetedByChannel = (to, from, text, message) => {
        let textArray = text.split(' ');
        if (!textArray.length) {
            app.say(to, 'You must specify a channel when clearing the greeter cache');
            return;
        }
        let [channel] = textArray;
        greetModel
            .where('channel', 'like', channel)
            .count()
            .then(total => app.say(to, `A total of ${total} greets have been sent out for the channel ${channel}`))
            .catch(err => {
                app.say(to, `Something went wrong fetching the greet total for ${channel}`);
                logger.error('Error in getting greet total', {
                    err
                });
            });
    };
    app.Commands.set('greet-total-channel', {
        desc: 'greet-total-channel [channel] - Get the total amount of greets for the specified channel',
        access: app.Config.accessLevels.owner,
        call: getTotalGreetedByChannel
    });

    // Return the script info
    return scriptInfo;
};
