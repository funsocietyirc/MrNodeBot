const fancy = require('../../lib/fancyText');

const scriptInfo = {
    name: 'fancy',
    desc: 'Fancy text back to the IRC user, a simple test script',
    createdBy: 'IronY',
};

module.exports = app => {
    // Echo Test command
    app.Commands.set('fancy', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app._ircClient.say(to, fancy(text))
    });

    // Return the script info
    return scriptInfo;
};
