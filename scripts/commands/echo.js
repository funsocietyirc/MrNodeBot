'use strict';
const scriptInfo = {
    name: 'echo',
    file: 'echo.js',
    desc: 'Echo text back to the IRC user, a simple test script',
    createdBy: 'Dave Richer'
};

module.exports = app => {
    const echo = (to, from, text, message) => {
        app.say(to, text);
    };

    // Echo Test command
    app.Commands.set('echo', {
        desc: '[text] Exactly what it sounds like',
        access: app.Config.accessLevels.identified,
        call: echo
    });

    // Return the script info
    return scriptInfo;
};
