/*
    Dark Army Channel Module
    - Join a list of channels following a bitshift algo
    Variables:
    process.env.darkArmyChannels Total Number of channels to Load (Default 5)
    process.env.darkArmyReport set to true if you want the bot to alert you that someone joined (defaults false)
    process.env.darkArmyDelay the dealy between joining channels, to prevent flood kick in seconds (defaults to 5 seconds)
*/
'use strict';
const conLogger = require('../../lib/consoleLogger');
const totalChans = 5;
const timeDelay = 5;

let darkChannels = require('../../lib/darkchannels')(process.env.darkArmyChannels || totalChans);
[
    '#th3g3ntl3man',
    '#darkarmy',
    '##test'
].forEach( i => {
    darkChannels.push(i);
});

module.exports = app => {

    // Join the dark army channels
    const joinChannels = () => {
        let interval = (process.env.darkArmyDelay || timeDelay) * 1000; // In seconds
        let timeMessage = `I am joining the Dark Army! It will take me ` + interval * darkChannels.length + ` seconds...`;
        if (app.Config.debug) {
            app.Bot.say(app.Config.ownerNick, timeMessage);
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
        if (nick != app.Bot.nick && (channel == '##test' || darkChannels.indexOf(channel) > -1)) {
            if (process.env.darkArmyReport) {
                app.Bot.say(app.Config.ownerNick, `${nick} joined the Dark Army Channel:  ${channel}`);
            }
            // Check to see if they are in channel
            if (!app.Bot.isInChannel('#fsociety', nick)) {
                setTimeout(() => {
                    app.Bot.say(nick, 'The time is now, #Fsociety needs your help. Joins us.');
                });
                setTimeout(() => {
                    app.Bot.send('invite', nick, '#fsociety');
                }, 4000);
            }
        }
    };

    // Topic lock if possible
    const topicLock = (channel, topic, nick, message) => {
        if (darkChannels.indexOf(channel) > -1 && !app.Bot.isTopicLocked(channel)) {
            if (topic.indexOf("#fsociety") == -1 || topic == '') {
                app.Bot.send('topic', channel, `${topic} | #fsociety`);
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
