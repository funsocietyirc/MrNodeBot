'use strict';
const scriptInfo = {
    name: 'tell',
    file: 'tell.js',
    createdBy: 'Dave Richer'
};

/*
    Send a message
    tell <nick> <message>
*/
module.exports = app => {
    const tell = (to, from, text, message) => {
        if (!text) {
            app.say(to, 'I need some more information...');
            return;
        }
        let nick = text.getFirst();
        let body = text.stripFirst();
        if (!nick || !body) {
            app.say(to, 'I need some more information...');
            return;
        }
        app.say(nick, body);
        app.say(to, 'I have told ' + nick + '  ' + body);
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('tell', {
        desc: 'tell [nick] [message] : Reach out and touch somebody',
        access: app.Config.accessLevels.owner,
        call: tell
    });

    // Return the script info
    return scriptInfo;
};
