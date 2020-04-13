const scriptInfo = {
    name: 'Channels',
    desc: 'Channel Utilities',
    createdBy: 'IronY',
};

const _ = require('lodash');

module.exports = app => {
    /**
     * Part Handler
     * @param to
     * @param from
     * @param text
     */
    const partHandler = (to, from, text) => {
        if (_.isEmpty(text)) {
            app.say(from, 'I need some more information...');
            return;
        }

        const textArray = text.split(' ');
        const [channel] = textArray;

        if (!app._ircClient.isInChannel(channel)) {
            app.say(from, `I am not in the channel ${channel}`);
            return;
        }

        // Part the channel
        app._ircClient.part(channel, () => app.say(from, `I have parted ${channel}`));
    };
    app.Commands.set('part', {
        desc: 'part [channel] Part a channel',
        access: app.Config.accessLevels.owner,
        call: partHandler,
    });

    /**
     * Join Handler
     * @param to
     * @param from
     * @param text
     */
    const joinHandler = (to, from, text) => {
        if (_.isEmpty(text)) {
            app.say(from, 'I need some more information...');
            return;
        }

        const textArray = text.split(' ');
        const [channel] = textArray;

        if (app._ircClient.isInChannel(channel)) {
            app.say(from, `I am already in the channel ${channel}`);
            return;
        }

        // Join the channel
        app._ircClient.join(channel, () => app.say(from, `I have joined ${channel}`));
    };
    app.Commands.set('join', {
        desc: 'join [channel] Join a channel',
        access: app.Config.accessLevels.owner,
        call: joinHandler,
    });

    /**
     * OP Handler
     * @param to
     * @param from
     * @param text
     */
    const opHandler = (to, from, text) => {
        const textArray = text.split(' ');

        if (textArray.length < 2) {
            app.say(from, 'I need some more information...');
            return;
        }

        const [channel, nick] = textArray;
        if (!app._ircClient.isInChannel(channel) || !app._ircClient.isInChannel(channel, nick)) {
            app.say(from, `Either I or ${nick} am not in ${channel}, so no one is getting ops..`);
            return;
        }
        app._ircClient.send('mode', channel, '+o', nick);
        app.say(from, `I have given all the power to ${nick} on ${channel}`);
    };
    app.Commands.set('op', {
        desc: 'op [channel] [nick] : Give someone all the powers..',
        access: app.Config.accessLevels.owner,
        call: opHandler,
    });

    // Return the script info
    return scriptInfo;
};
