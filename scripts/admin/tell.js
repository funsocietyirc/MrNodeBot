const scriptInfo = {
    name: 'tell',
    desc: 'Have the Bot give a channel or user a message',
    createdBy: 'IronY',
};
const _ = require('lodash');
const t = require('../../lib/localize');
// Localizations
const i18next = require('../../lib/i18next');

i18next.addResources('en', 'tell', {
    help: 'tell [nick] [message] : Reach out and touch somebody',
    reportBack: 'I have told {{- nick} {{- body}}}',
});

module.exports = (app) => {
    const tell = (to, from, text, message) => {
        const textArray = text.split(' ');
        const [nick] = textArray;
        const body = _.without(textArray, nick).join(' ');

        if (!nick || !body) {
            app.say(to, t('errors.information', {
                nick: to,
            }));
            return;
        }

        app.say(nick, body);

        // Report back
        if (nick !== to) {
            app.say(t('tell:reportBack', {
                nick,
                body,
            }));
        }
    };
    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('tell', {
        desc: t('tell:help'),
        access: app.Config.accessLevels.admin,
        call: tell,
    });

    // Return the script info
    return scriptInfo;
};
