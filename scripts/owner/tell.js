'use strict';
/*
    Send a message
    tell <nick> <message>
*/
module.exports = app => {
    const tell = (to, from, text, message) => {
        if (!text) {
            app.Bot.say(to, 'I need some more information...');
            return;
        }
        let nick = text.getFirst();
        let  body = text.stripFirst();
        if(!nick || !body) {
            app.Bot.say(to, 'I need some more information...');
            return;
        }
        app.Bot.say(nick, body);
        app.Bot.say(to, 'I have told ' + nick + '  ' + body);
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('tell', {
        desc: 'tell [nick] [message] : Reach out and touch somebody',
        access: app.Config.accessLevels.owner,
        call: tell
    });
};
