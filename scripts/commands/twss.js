'use strict';
const scriptInfo = {
    name: 'TWSS',
    desc: 'Get TWSS Quote',
    createdBy: 'IronY'
};
const _ = require('lodash');
const gen = require('../generators/_twssLine');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    app.Commands.set('twss', {
        desc: 'Get a random TWSS quote',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => gen()
            .then(result => {
                if (!result) {
                    app.say(to, 'I could not seem to find any TWSS lines');
                    return;
                }
                let output = new ircTypography.StringBuilder({
                    logo: 'twss'
                });
                output.append(result[0]);
                app.say(to, output.text);
            })
            .catch(err => {
                app.say(to, 'Something went wrong with the TWSS API');
                logger.error('TWSS Command Error:', {
                    err
                });
            })
    });
    return scriptInfo;
};
