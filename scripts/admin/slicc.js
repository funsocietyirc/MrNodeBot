const slicc = require('../../lib/sliccText');

const scriptInfo = {
    name: 'slicc',
    desc: 'Slicc text back to the IRC user, a simple test script',
    createdBy: 'IronY',
};

module.exports = app => {
    // Echo Test command
    app.Commands.set('slicc', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app.say(to, slicc(text))
    });

    // Return the script info
    return scriptInfo;
};
