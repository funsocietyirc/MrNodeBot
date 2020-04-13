const slicc = require('../../lib/sliccText');

const scriptInfo = {
    name: 'slicc',
    desc: 'Slicc text back to the IRC user, a simple test script',
    createdBy: 'IronY',
};

module.exports = app => {
    /**
     * Slicc Handler
     * @param to
     * @param from
     * @param text
     */
    const sliccHandler = (to, from, text) => app.say(to, slicc(text));
    app.Commands.set('slicc', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.admin,
        call: sliccHandler,
    });

    // Return the script info
    return scriptInfo;
};
