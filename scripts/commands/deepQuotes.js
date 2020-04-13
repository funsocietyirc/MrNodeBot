const gen = require('../generators/_deepQuote');

const scriptInfo = {
    name: 'deepQuotes',
    desc: 'Deep Quotes by Jack Handy',
    createdBy: 'IronY',
};

module.exports = app => {
    /**
     * Deep Quote Handler
     * @param to
     */
    const deepQuoteHandler = to =>app.say(to, `${gen()} -- By Jack Handy`);
    app.Commands.set('deepquote', {
        desc: 'Deep Quotes By Jack Handy',
        access: app.Config.accessLevels.identified,
        call: deepQuoteHandler,
    });
    // Return the script info
    return scriptInfo;
};
