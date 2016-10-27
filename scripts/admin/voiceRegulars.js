'use strict';
const scriptInfo = {
    name: 'Voice Regulars',
    file: 'voiceRegulars.js',
    desc: 'Voice users by participation',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const gen = require('../lib/_voiceUsersInChannel');
const threshold = 50;

module.exports = app => {
    if (!app.Database || !Models.Logging) return scriptInfo;

    const voiceRegulars = (to, from, text, message) => {
        let txtArray = text.split(' ');
        let channel = null;
        let thresh = null;

        switch (txtArray.length) {
            case 1:
                channel = _.isEmpty(txtArray[0]) ? to : txtArray[0];
                thresh = threshold;
                break;
            case 2:
                channel = txtArray[0];
                thresh = txtArray[1] % 1 === 0 ? txtArray[1] : threshold;
                break
        }
        gen(channel, thresh, app)
          .then(result => app.say(from, result));
    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('voice-regulars', {
        desc: '[Channel?] [Threshold?] Voice the regulars in a channel',
        access: app.Config.accessLevels.admin,
        call: voiceRegulars
    });

    // Return the script info
    return scriptInfo;
};
