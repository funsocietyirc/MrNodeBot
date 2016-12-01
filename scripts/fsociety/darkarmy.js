/*
    Dark Army Channel Module
    - Join a list of channels following a bitshift algo
*/
'use strict';
const scriptInfo = {
    name: 'darkarmy',
    desc: 'Just a list of Dark Army Random channels, Topic Lock advertisements for main channel,' +
        'Provide a list of currently joined Darm Army channels',
    createdBy: 'IronY'
};

const _ = require('lodash');
const logger = require('../../lib/logger');

module.exports = app => {
    // Get threshold

    // Check to see if a main channel has been Set, if not bail out
    if (_.isEmpty(app.Config.features.fsociety.mainChannel)) return scriptInfo;

    // Join main channel
    if (!_.includes(app.channels, app.Config.features.fsociety.mainChannel)) app._ircClient.join(app.Config.features.fsociety.mainChannel);

    // Join the dark army channels
    const darkChannels = app.Config.features.fsociety.additionalChannels.concat(require('./_darkChannels')(app.Config.features.fsociety.totalChannels));
    const joinChannels = () => {
        if (!darkChannels.length) return;
        
        const interval = app.Config.features.fsociety.delay * 1000; // In seconds
        const timeMessage = `I am joining the Dark Army! It will take me ` + app.Config.features.fsociety.delay * darkChannels.length + ` seconds...`;

        logger.info(timeMessage);

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
    // Provide a OnConnected provider, this will fire when the bot connects to the network
    app.OnConnected.set('darkarmy', {
        call: joinChannels,
        desc: 'Join Fsociety channels',
        name: 'DarkArmy'
    });

    // Topic lock if possible
    const topicLock = (channel, topic, nick, message) => {
        if (_.includes(darkChannels, channel) && !app._ircClient.isTopicLocked(channel)) {
            if (!_.includes(topic, app.Config.features.fsociety.mainChannel) || topic == '') {
                app._ircClient.send('topic', channel, `${topic} | ${app.Config.features.fsociety.mainChannel}`);
            }
        }
    };
    // Try to lock down a topic if possible
    app.OnTopic.set('topicjacking', {
        call: topicLock,
        name: 'topicjacking'
    });

    // Send someone a list of the channels
    const darkarmy = (to, from, text, message) => {
        app.say(from, `Join me on ${app.Config.features.fsociety.mainChannel} or one of the other Mr. Robot channels: ` + darkChannels.join(' '));
    };
    // A command to get a list of joined dark army channels
    app.Commands.set('dark-channels', {
        desc: 'Get a list of Dark Army Channels',
        access: app.Config.accessLevels.guest,
        call: darkarmy
    });

    // Return the script info
    return scriptInfo;
};
