// Inspired by https://sjwinsult.com

const scriptInfo = {
    name: 'SJW Insult generator',
    desc: 'Because why not',
    createdBy: 'IronY',
};

const _ = require('lodash');

const sjwLine = require('../generators/_sjwInsultLine');

module.exports = app => {

    /**
     * SJW Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const sjwHandler = async (to, from,) => {
        const line = await sjwLine();
        app.say(to, `${from}, ${_.first(line)}`);
    };
    app.Commands.set('sjw', {
        desc: 'Get insulted, SJW style',
        access: app.Config.accessLevels.identified,
        call: sjwHandler,
    });

    return scriptInfo;
};
