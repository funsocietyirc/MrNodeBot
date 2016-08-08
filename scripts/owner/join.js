'use strict';
/*
    Join a channel
    join <channel>
*/
module.exports = app => {
    const join = (to, from, text, message) => {
        if (!text) {
            app.Bot.say(from, 'I need some more information...');
            return;
        }
        let channel = text.getFirst();
        if(!channel) {
            app.Bot.say(from, 'I need some more information...');
            return;
        }

        // Join the channel
        app.Bot.join(channel, () => {
            app.Bot.say(from, `I have joined ${channel}`);
        });

    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('join', {
        desc: 'join [channel] Join a channel',
        access: app.Config.accessLevels.owner,
        call: join
    });
};
