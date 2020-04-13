// Inspired by https://sjwinsult.com

const scriptInfo = {
    name: 'SJW Insult generator',
    desc: 'Because why not',
    createdBy: 'IronY',
};

const _ = require('lodash');

const sjwLine = require('../generators/_sjwInsultLine');

module.exports = app => {
    const sjw = async (to, from, text, message) => {
        // Report back to IRC
        const line = await sjwLine();
        app.say(to, `${from}, ${_.first(line)}`);
    };

    // Report an image of our lord and savour, RaptorJesus
    app.Commands.set('sjw', {
        desc: 'Get insulted, SJW style',
        access: app.Config.accessLevels.identified,
        call: sjw,
    });

    return scriptInfo;
};
