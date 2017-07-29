'use strict';
const scriptInfo = {
    name: 'BOFH Excuse',
    desc: 'Provider Bastard Operator from hell excuses',
    createdBy: 'IronY'
};
const gen = require('../generators/_bofhExcuse');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    const bofh = async (to, from, text, message) => {
        const excuse = await gen();
        app.say(text.split(' ')[0] || to, `${ircTypography.logos.bofh} ${excuse}`);
    };
    // Random BOFH Excuse
    app.Commands.set('bofh', {
        desc: '[Channel?] Send a BOFH excuse',
        access: app.Config.accessLevels.identified,
        call: bofh
    });

    // Return the script info
    return scriptInfo;
};
