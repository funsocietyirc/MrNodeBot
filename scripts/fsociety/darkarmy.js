/*
    Dark Army Channel Module
    - Join a list of channels following a bitshift algo
*/
'use strict';
const scriptInfo = {
    name: 'darkarmy',
    file: 'darkarmy.js',
    createdBy: 'Dave Richer'
};

const conLogger = require('../../lib/consoleLogger');
const _ = require('lodash');

module.exports = app => {
    // Check to see if a main channel has been Set, if not bail out
    if (_.isEmpty(app.Config.features.fsociety.mainChannel)) {
        return;
    }

    // Join main channel
    app._ircClient.join(app.Config.features.fsociety.mainChannel);

    // Grab a list of the 'darm army channels'
    let darkChannels = app.Config.features.fsociety.additionalChannels.concat(require('../../lib/darkchannels')(app.Config.features.fsociety.totalChannels));

    // Join the dark army channels
    const joinChannels = () => {
        if (!darkChannels.length) {
            return;
        }

        const interval = app.Config.features.fsociety.delay * 1000; // In seconds
        const timeMessage = `I am joining the Dark Army! It will take me ` + interval * darkChannels.length + ` seconds...`;

        if (app.Config.debug) {
            app.say(app.Config.owner.nick, timeMessage);
        }
        conLogger(timeMessage, 'info');
        for (var i = 0; i < darkChannels.length; i++) {
            setTimeout(function(i) {
                app._ircClient.join(darkChannels[i]);
            }, interval * i, i);
        }
    };

    // Report back if anyone joins them (to owner)
    // will be turned on if process.env.darkArmReport is set to true
    const onJoin = (channel, nick, message) => {
        if (nick != app._ircClient.nick && _.includes(darkChannels, channel)) {
            if (app.Config.features.fsociety.report) {
                app.say(app.Config.owner.nick, `${nick} joined the Dark Army Channel:  ${channel}`);
            }
            // Defer for twenty seconds in the event the join order is out of whack
            setTimeout(() => {
                // Check to see if they are in channel
                if (!app._ircClient.isInChannel('#fsociety', nick)) {
                    app.say(nick, 'The time is now, #Fsociety needs your help. Joins us.');
                    app._ircClient.send('invite', nick, app.Config.features.fsociety.mainChannel);
                }
            }, app.Config.features.fsociety.greeterDealy * 1000);
        }
    };

    // Topic lock if possible
    const topicLock = (channel, topic, nick, message) => {
        if (_.includes(darkChannels, channel) && !app._ircClient.isTopicLocked(channel)) {
            if (!_.includes(topic, app.Config.features.fsociety.mainChannel) || topic == '') {
                app._ircClient.send('topic', channel, `${topic} | ${app.Config.features.fsociety.mainChannel}`);
            }
        }
    };

    // Send someone a list of the channels
    const darkarmy = (to, from, text, message) => {
        app.say(from, `Join me on ${app.Config.features.fsociety.mainChannel} or one of the other Mr. Robot channels: ` + darkChannels.join(' '));
    };

    // Provide a registered provider, this will fire when the bot connects to the network
    app.Registered.set('darkarmy', {
        call: joinChannels,
        desc: 'Join Fsociety channels',
        name: 'DarkArmy'
    });

    // Provide a onjoin handler
    app.OnJoin.set('darkarmy', {
        call: onJoin,
        name: 'DarkArmy'
    });

    // A command to get a list of joined dark army channels
    app.Commands.set('dark-channels', {
        desc: 'Get a list of Dark Army Channels',
        access: app.Config.accessLevels.guest,
        call: darkarmy
    });

    // Try to lock down a topic if possible
    app.OnTopic.set('topicjacking', {
        call: topicLock,
        name: 'topicjacking'
    });

    // Return the script info
    return scriptInfo;
};
