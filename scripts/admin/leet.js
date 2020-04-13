const scriptInfo = {
    name: 'leet',
    desc: 'The leet speak version of tell',
    createdBy: 'IronY',
};
const {leetSpeak} = require('../../helpers');
const _ = require('lodash');

module.exports = app => {
    /**
     * Leet Handler
     * @param to
     * @param from
     * @param text
     */
    const leetHandler = (to, from, text) => {
        const textArray = text.split(' ');
        const [nick] = textArray;
        const body = _.without(textArray, nick).join(' ');
        if (!nick || !body) {
            app.say(from, 'I need some more information...');
            return;
        }
        const leetBody = leetSpeak(body);
        app.say(nick, leetBody);
        app.say(from, `I have told ${nick}  ${leetBody}`);
    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('leet', {
        desc: 'leet [nick] [message] : Reach out and touch somebody',
        access: app.Config.accessLevels.admin,
        call: leetHandler,
    });

    // Return the script info
    return scriptInfo;
};
