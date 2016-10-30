'use strict';
const scriptInfo = {
    name: 'Converse',
    desc: 'Converse with the bot',
    createdBy: 'Dave Richer'
};

const gen = require('../generators/_chatBotLine');

module.exports = app => {
    const converse = (to, from, text, message) => {
        gen(text).then(result => app.say(to, `${from}, ${result}`));
    };

    app.Commands.set('converse', {
        desc: '[Text?] Talk to the bot',
        access: app.Config.accessLevels.identified,
        call: converse
    });

    return scriptInfo;
};
