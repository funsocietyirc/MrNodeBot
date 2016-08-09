'use strict';

const color = require('irc-colors');

module.exports = app => {
    const introductionSeed = [
        'Well', 'Oh', 'Ahem', 'Alas', 'Amen', 'Er', 'Hooray', 'Wow', 'Ah', 'Egad', 'Golly', 'Psst'
    ];

    const salutationsSeed = [
        'hello', 'ahoy hoy', 'salutations', 'greetings', 'hi', 'howdy', 'welcome', 'bonjour',
        'buenas noches', 'buenos dias', 'good day', 'hey', 'hi-ya', 'how are you',
        'how goes it', 'howdy-do', 'shalom', `what's happening`, `what's up`
    ];

    const hello = (to, from, text, message) => {
        let introduction = app.random.pick(app.randomEngine, introductionSeed);
        let salutations = app.random.pick(app.randomEngine, salutationsSeed);

        app.Bot.say(to, color.rainbow(`${introduction} ${salutations} ${from}`));
    };

    // Hello Test command
    app.Commands.set('hello', {
        desc: 'The hello test command, its quite colorful',
        access: app.Config.accessLevels.guest,
        call: hello
    });
};
