'use strict';
const scriptInfo = {
    name: 'darkarmy',
    desc: "Just a list of Dark Army Random channels, Topic Lock advertisements for main channel, Provide a list of currently joined Dark Army channels",
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

    // Fetch the dark army channels
    const darkChannels = app.Config.features.fsociety.additionalChannels.concat(require('./_darkChannels')(app.Config.features.fsociety.totalChannels));

    // Join the dark army channel
    const joinChannels = () => {
        if (!darkChannels.length) return;

        const interval = app.Config.features.fsociety.delay * 1000; // In seconds
        const timeMessage = `I am joining the Dark Army! It will take me ` + app.Config.features.fsociety.delay * darkChannels.length + ` seconds...`;

        logger.info(timeMessage);

        // Join any channels we are not already on
        _(darkChannels)
            .reject(dc => _.includes(app.channels, dc))
            .each((channel, i) =>
                setTimeout(
                    () => app._ircClient.join(channel),
                    interval * i, i)
            );
    };
    // Provide a OnConnected provider, this will fire when the bot connects to the network
    app.OnConnected.set('darkarmy', {
        call: joinChannels,
        desc: 'Join Fsociety channels',
        name: 'DarkArmy'
    });

    // Topic lock if possible
    const topicLock = (channel, topic, nick, message) => {
        setTimeout(() => {
            if (
                _.includes(darkChannels, channel) && (!app._ircClient.isTopicLocked(channel) || app._ircClient.isOpInChannel(channel)) &&
                (!_.includes(topic, app.Config.features.fsociety.mainChannel) || topic === '')
            ) app._ircClient.send('topic', channel, `${topic} | ${app.Config.features.fsociety.mainChannel}`);
        }, 5000);
    };
    // Try to lock down a topic if possible
    app.OnTopic.set('topicjacking', {
        call: topicLock,
        name: 'topicjacking'
    });

    // Send someone a list of the channels
    const darkarmy = (to, from, text, message) => {
        app.say(to, `I have private messaged you the dark channels, ${from}`);
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
