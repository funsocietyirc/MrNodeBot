'use strict';
const scriptInfo = {
    name: 'BOFH Excuse',
    file: 'bofh.js',
    desc: 'Provider Bastard Operator from hell excuses',
    createdBy: 'Dave Richer'
};

const gen = require('../generators/_bofhExcuse');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    const bofh = (to, from, text, message) => {
      let [chan] = text.split(' ');
      gen()
        .then(excuse => {
          app.say(chan || to, `${ircTypography.logos.bofh} ${excuse}`);
        });
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
