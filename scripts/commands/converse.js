const scriptInfo = {
    name: 'Converse',
    desc: 'Converse with the bot',
    createdBy: 'IronY',
};
const gen = require('../../lib/chatBotLine');

module.exports = (app) => {
    const line = async (to, from, text, message) => {
        const result = await gen(text);
        app.say(to, `${from}, ${result}`);
    };

    app.Commands.set('converse', {
        desc: '[Text?] Talk to the bot',
        access: app.Config.accessLevels.identified,
        call: line,
    });

    return scriptInfo;
};
