'use strict';
const scriptInfo = {
    name: 'BOFH Excuse',
    file: 'bofh.js',
    desc: 'Provider Bastard Operator from hell excuses',
    createdBy: 'Dave Richer'
};

const bofh = require('../../helpers').Excuse;
const ircTypography = require('../../lib/ircTypography');
const _ = require('lodash');


module.exports = app => {
    // Random BOFH Excuse
    app.Commands.set('bofh', {
        desc: '[Channel?] Send a BOFH excuse',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            let chan = _.first(text.split(' '));
            app.say(chan || to, `${ircTypography.logos.bofh} ${bofh()}`);
        }
    });

    // Return the script info
    return scriptInfo;
};
