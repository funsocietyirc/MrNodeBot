'use strict';
const scriptInfo = {
    name: 'leet',
    file: 'leet.js',
    createdBy: 'Dave Richer'
};


const leetSpeak = require('../../helpers').leetSpeak;

/*
    Send an elite message
    leet <nick> <message>
*/
module.exports = app => {
    const leet = (to, from, text, message) => {
        if (!text) {
            app.say(from, 'I need some more information...');
            return;
        }
        let nick = text.getFirst();
        let body = text.stripFirst();
        if (!nick || !body) {
            app.say(from, 'I need some more information...');
            return;
        }
        let leetBody = leetSpeak(body);
        app.say(nick, leetBody);
        app.say(from, 'I have told ' + nick + '  ' + leetBody);
    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('leet', {
        desc: 'leet [nick] [message] : Reach out and touch somebody',
        access: app.Config.accessLevels.owner,
        call: leet,
        deps: ['tell']
    });

    // Return the script info
    return scriptInfo;
};
