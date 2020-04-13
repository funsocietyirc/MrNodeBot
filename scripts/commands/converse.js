const scriptInfo = {
    name: 'Converse',
    desc: 'Converse with the bot',
    createdBy: 'IronY',
};
const gen = require('../../lib/chatBotLine');

module.exports = app => {
    /**
     * Converse Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const converseHandler = async (to, from, text) => {
        const result = await gen(text);
        app.say(to, `${from}, ${result}`);
    };
    app.Commands.set('converse', {
        desc: '[Text?] Talk to the bot',
        access: app.Config.accessLevels.identified,
        call: converseHandler,
    });

    return scriptInfo;
};
