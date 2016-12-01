'use strict';
const scriptInfo = {
    name: 'stats',
    desc: 'Provide very basic command usage stats',
    createdBy: 'IronY'
};

const helpers = require('../../helpers');

module.exports = app => {
    // Get command usage statistics
    app.Commands.set('stats', {
        desc: 'Get command usage statistics',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            app.Stats.forEach((value, key) => {
                if (!app.Commands.get(key)[2]) app.say(from, `${key} : ${value}`);
            });
        }
    });
    // Get the bots uptime
    app.Commands.set('uptime', {
        desc: 'Get the current uptime',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => app.say(from, `I have been alive since ${helpers.Uptime()}`)
    });

    // Return the script info
    return scriptInfo;
};
