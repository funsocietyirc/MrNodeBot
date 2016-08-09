/*
    Dark Army Channel Module
    - Join a list of channels following a bitshift algo
*/
'use strict';
const conLogger = require('../../lib/consoleLogger');

module.exports = app => {
    // Check to see if a main channel has been Set, if not bail out
    if (app.Config.features.darkArmy.mainChannel === '') {
        return;
    }

    // Join main channel
    app.Bot.join(app.Config.features.darkArmy.mainChannel);

    // Grab a list of the 'darm army channels'
    let darkChannels = app.Config.features.darkArmy.additionalChannels.concat(require('../../lib/darkchannels')(app.Config.features.darkArmy.totalChannels));

    // Join the dark army channels
    const joinChannels = () => {
        if (!darkChannels.length) {
            return;
        }

        const interval = app.Config.features.darkArmy.delay * 1000; // In seconds
        const timeMessage = `I am joining the Dark Army! It will take me ` + interval * darkChannels.length + ` seconds...`;

        if (app.Config.debug) {
            app.Bot.say(app.Config.owner.nick, timeMessage);
        }
        conLogger(timeMessage, 'info');
        for (var i = 0; i < darkChannels.length; i++) {
            setTimeout(function(i) {
                app.Bot.join(darkChannels[i]);
            }, interval * i, i);
        }
    };

    // Report back if anyone joins them (to owner)
    // will be turned on if process.env.darkArmReport is set to true
    const onJoin = (channel, nick, message) => {
        if (nick != app.Bot.nick && darkChannels.indexOf(channel) > -1) {
            if (app.Config.features.darkArmy.report) {
                app.Bot.say(app.Config.owner.nick, `${nick} joined the Dark Army Channel:  ${channel}`);
            }
            // Defer for twenty seconds in the avent the join order is out of whack
            setTimeout(() => {
                // Check to see if they are in channel
                if (!app.Bot.isInChannel('#fsociety', nick)) {
                    app.Bot.say(nick, 'The time is now, #Fsociety needs your help. Joins us.');
                    app.Bot.send('invite', nick, app.Config.features.darkArmy.mainChannel);
                }
            }, app.Config.features.darkArmy.greeterDealy * 1000);
        }
    };

    // Topic lock if possible
    const topicLock = (channel, topic, nick, message) => {
        if (darkChannels.indexOf(channel) > -1 && !app.Bot.isTopicLocked(channel)) {
            if (topic.indexOf(app.Config.features.darkArmy.mainChannel) == -1 || topic == '') {
                app.Bot.send('topic', channel, `${topic} | ${app.Config.features.darkArmy.mainChannel}`);
            }
        }
    };

    // Send someone a list of the channels
    const darkarmy = (to, from, text, message) => {
        app.Bot.say(from, `You can Join in me in the dark Army channels: ` + channels.join(' '));
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

};
