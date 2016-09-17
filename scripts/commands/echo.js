'use strict';
const scriptInfo = {
    name: 'echo',
    file: 'echo.js',
    createdBy: 'Dave Richer'
};

module.exports = app => {
    const echo = (to, from, text, message) => {
        app.say(to, text);
    };

    // Echo Test command
    app.Commands.set('echo', {
        desc: 'Exactly what it sounds like',
        access: app.Config.accessLevels.identified,
        call: echo
    });

    // Return the script info
    return scriptInfo;
};
