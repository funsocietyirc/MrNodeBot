/*
    Dark Army Channel Module
    - Join a list of channels following a bitshift algo
*/
'use strict';
const scriptInfo = {
    name: 'darkarmy',
    file: 'darkarmy.js',
    desc: 'Just a list of Dark Army Random channels, Topic Lock advertisements for main channel,' +
        'Provide a list of currently joined Darm Army channels',
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
    if (!_.includes(app.channels, app.Config.features.fsociety.mainChannel)) {
        app._ircClient.join(app.Config.features.fsociety.mainChannel);
    }

    // Grab a list of the 'darm army channels'
    let darkChannels =  _.merge(app.Config.features.fsociety.additionalChannels, require('./_darkChannels')(app.Config.features.fsociety.totalChannels));


    // Join the dark army channels
    const joinChannels = () => {
      console.log(darkChannels);

        if (!darkChannels.length) {
            return;
        }

        const interval = app.Config.features.fsociety.delay * 1000; // In seconds
        const timeMessage = `I am joining the Dark Army! It will take me ` + app.Config.features.fsociety.delay * darkChannels.length + ` seconds...`;

        if (app.Config.debug) {
            app.say(app.Config.owner.nick, timeMessage);
        }

        conLogger(timeMessage, 'info');

        _.each(darkChannels, (channel, i) => {
            if (!_.includes(app.channels, channel)) {
                setTimeout(
                    () => {
                      app.channels = channel;
                    },
                    interval * i, i);
            }
        });
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
