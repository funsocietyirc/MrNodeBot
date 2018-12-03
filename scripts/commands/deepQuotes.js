const gen = require('../generators/_deepQuote');

const scriptInfo = {
    name: 'deepQuotes',
    desc: 'Deep Quotes by Jack Handy',
    createdBy: 'IronY',
};

module.exports = (app) => {
    app.Commands.set('deepquote', {
        desc: 'Deep Quotes By Jack Handy',
        access: app.Config.accessLevels.identified,
        call: (to) =>  app.say(to, `${gen()} -- By Jack Handy`),
    });
    // Return the script info
    return scriptInfo;
};
