'use strict';
const scriptInfo = {
    name: 'join',
    file: 'join.js',
    createdBy: 'Dave Richer'
};

/*
    Join a channel
    join <channel>
*/
module.exports = app => {
    const join = (to, from, text, message) => {
        if (!text) {
            app.say(from, 'I need some more information...');
            return;
        }
        let channel = text.getFirst();
        if (!channel) {
            app.say(from, 'I need some more information...');
            return;
        }

        // Join the channel
        app._ircClient.join(channel, () => {
            app.say(from, `I have joined ${channel}`);
        });

    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('join', {
        desc: 'join [channel] Join a channel',
        access: app.Config.accessLevels.owner,
        call: join
    });

    // Return the script info
    return scriptInfo;
};
