'use strict';

const helpers = require('../../helpers');

/**
  Statistical commands
  Commands: stats uptime
*/
module.exports = app => {
    const stats = (to, from, text, message) => {
        app.Stats.forEach((value, key) => {
            if (!app.Commands.get(key)[2])
                app.say(from, `${key} : ${value}`);
        });
    };

    const uptime = (to, from, text, message) => {
        app.say(from, `I have been alive since ${helpers.Uptime()}`);
    };

    // Get command usage statistics
    app.Commands.set('stats', {
        desc: 'Get command usage statistics',
        access: app.Config.accessLevels.admin,
        call: stats
    });

    // Get the bots uptime
    app.Commands.set('uptime', {
        desc: 'Get the current uptime',
        access: app.Config.accessLevels.admin,
        call: uptime
    });

};
