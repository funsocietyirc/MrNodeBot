'use strict';
const scriptInfo = {
    name: 'apocalypse Dooms day clock',
    desc: 'Give mins to midnight',
    createdBy: 'IronY'
};
const gen = require('../generators/_doomsday');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    // Random BOFH Excuse
    app.Commands.set('apocalypse', {
        desc: 'Get a reading from the Doomsday clock',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => gen()
            .then(m2m => app.say(to, `${ircTypography.logos.m2m} is currently set to ${m2m}`))
    });
    // Return the script info
    return scriptInfo;
};
