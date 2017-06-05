'use strict';
const scriptInfo = {
    name: 'Happening',
    desc: 'MrRobot Season 3 countdown',
    createdBy: 'IronY'
};
const _ = require('lodash');
const moment = require('moment');
const scheduler = require("../../lib/scheduler.js");

// Extend moment with countdown
require('moment-countdown');

module.exports = app => {
    const showTime = new Date(2017, 10, 4, 22, 0, 0, 0);

    // Season 3 Countdown
    const getCountdown = () => moment(showTime).countdown();

    // Countdown text options
    const textOptions = '{is Happening in|is Coming to a screen near you in|is Hacking all the things in|will be brought to you in|drops in|is hacking your democracy in}';

    // Season 3 Countdown Message
    const getCountdownMessage = () => `Season 3 of Mr. Robot is ${textOptions} ${getCountdown().toString()}!!`;

    // Scheduled every night
    let cronTime = new scheduler.RecurrenceRule();
    cronTime.second = 0;
    cronTime.minute = 0;
    cronTime.hour = 0;
    scheduler.schedule('timeUntilMrRobot', cronTime, () => app.say('#fsociety', getCountdownMessage()));

    // IRC Command
    app.Commands.set('happening', {
        desc: 'Mr. Robot Season 3 countdown',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app.say(to, getCountdownMessage())
    });

    return scriptInfo;
};
