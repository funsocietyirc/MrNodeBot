'use strict';
const scriptInfo = {
    name: 'Channels',
    desc: 'Channel Utilities',
    createdBy: 'IronY'
};
const _ = require('lodash');

module.exports = app => {

    // Part Channel
    const part = (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(from, 'I need some more information...');
            return;
        }
        let textArray = text.split(' ');
        let [channel] = textArray;
        if (!app._ircClient.isInChannel(channel)) {
            app.say(from, `I am not in the channel ${channel}`);
            return
        }
        // Part the channel
        app._ircClient.part(channel, () => {
            app.say(from, `I have parted ${channel}`);
        });
    };
    app.Commands.set('part', {
        desc: 'part [channel] Part a channel',
        access: app.Config.accessLevels.owner,
        call: part
    });

    // Join Channel
    const join = (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(from, 'I need some more information...');
            return;
        }

        let textArray = text.split(' ');
        let [channel] = textArray;

        if (app._ircClient.isInChannel(channel)) {
            app.say(from, `I am already in that channel channel ${channel}`);
            return;
        }

        // Join the channel
        app._ircClient.join(channel, () => app.say(from, `I have joined ${channel}`));

    };
    app.Commands.set('join', {
        desc: 'join [channel] Join a channel',
        access: app.Config.accessLevels.owner,
        call: join
    });

    // OP Someone
    const op = (to, from, text, message) => {
        let textArray = text.split(' ');
        if (!textArray.length < 2) {
            app.say(from, 'I need some more information...');
            return;
        }
        let [channel, nick] = textArray;
        if (!app._ircClient.isInChannel(channel) || !app._ircClient.isInChannel(channel, nick)) {
            app.say(from, `Either I or ${nick} am not in ${channel}, so no one is getting ops..`);
            return;
        }
        app._ircClient.send('mode', channel, '+o', nick);
        app.say(from, 'I have given all the power to ' + nick + ' on ' + channel);
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('op', {
        desc: 'op [channel] [nick] : Give someone all the powers..',
        access: app.Config.accessLevels.owner,
        call: op
    });

    // Return the script info
    return scriptInfo;
};
