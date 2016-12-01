'use strict';
const scriptInfo = {
    name: 'hello',
    desc: 'Display a salutation to a IRC user, randomText test script',
    createdBy: 'IronY'
};

const color = require('irc-colors');

module.exports = app => {
    const introduction = 'Welcome|Oh|Alas|Amen|Er|Hooray|Wow|Ah|Egad|Golly|Psst';
    const salutation = 'hello|ahoy hoy|salutations|greetings|hi|howdy|welcome|bonjour|buenas noches|buenos dias|good day|hey|hi-yea|how are you|how goes it| howdy-do|shalom|whats happening|whats up';
    // Hello Test command
    app.Commands.set('hello', {
        desc: 'The hello test command, its quite colorful',
        access: app.Config.accessLevels.guest,
        call: (to, from, text, message) => app.say(to, color.rainbow(`{${introduction}} {${salutation}} ${from}`))
    });

    // Return the script info
    return scriptInfo;
};
