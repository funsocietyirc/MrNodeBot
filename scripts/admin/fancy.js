const fancy = require('../../lib/fancyText');

const scriptInfo = {
    name: 'fancy',
    desc: 'Fancy text back to the IRC user, a simple test script',
    createdBy: 'IronY',
};

module.exports = app => {

    /**
     * Fancy Handler
     * @param to
     * @param from
     * @param text
     */
    const fancyHandler = (to, from, text) =>  app._ircClient.say(to, fancy(text));
    app.Commands.set('fancy', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.admin,
        call: fancyHandler,
    });

    // Return the script info
    return scriptInfo;
};
