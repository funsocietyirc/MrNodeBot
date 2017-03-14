'use strict';
const scriptInfo = {
    name: 'echo',
    desc: 'Echo text back to the IRC user, a simple test script',
    createdBy: 'IronY'
};

module.exports = app => {
    // Echo Test command
    app.Commands.set('echo', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app.say(to, text)
    });

    // Return the script info
    return scriptInfo;
};
