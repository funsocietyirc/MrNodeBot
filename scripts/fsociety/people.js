const scriptInfo = {
    name: 'FSociety Peoples',
    desc: 'Commands for certain #fsociety members',
    createdBy: 'IronY',
};
const _ = require('lodash');
const excuse = require('../generators/_simpleExcuse');

module.exports = app => {

    /**
     *
     * @param to
     * @returns {Promise<void>}
     */
    const eagleExcuseHandler = to => excuse().then(excuses => app.say(to, _.first(excuses)));
    app.Commands.set('eagle-excuse', {
        desc: 'Get a random excuse, DIY excuse style',
        access: app.Config.accessLevels.identified,
        call: eagleExcuseHandler,
    });

    return scriptInfo;
};
