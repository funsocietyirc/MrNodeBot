'use strict';
const scriptInfo = {
    name: 'Happening',
    desc: 'MrRobot Season 3 countdown',
    createdBy: 'IronY'
};
const _ = require('lodash');
const moment = require('moment');
// Extend moment with countdown
require('moment-countdown');

module.exports = app => {
    const showTime = new Date(2017, 10, 4, 22, 0, 0, 0);
    app.Commands.set('happening', {
        desc: 'Mr. Robot Season 3 countdown',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            const countdown = moment(showTime).countdown();
            app.say(to, `Season 3 of Mr. Robot is Happening in ${countdown.toString()}!!`)
        }
    });
    return scriptInfo;
};
