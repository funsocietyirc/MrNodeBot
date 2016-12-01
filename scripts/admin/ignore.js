'use strict';
const scriptInfo = {
    name: 'ignore',
    desc: 'Private mute, unmute, and ignored commands. Prevents the bot from seeing messages from ' +
        'specified IRC users',
    createdBy: 'IronY'
};

const storage = require("node-persist");
const _ = require('lodash');

/**
  Manipulation of the Ignore list.
  Users on the mute list are not acknowledged by the bot
  Commands: mute un-mute Ignored
**/
module.exports = app => {

    // Mute a user
    app.Commands.set('mute', {
        desc: 'Mute a user',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            if (!text) {
                app.say(from, `You should probably specify who it is you would like to mute`);
                return;
            }

            let [nick] = text.split(' ');
            let lowerCaseNick = _.toLower(nick);

            if (!_.includes(app.Admins, lowerCaseNick) && !_.includes(app.Ignore, lowerCaseNick)) {
                app.say(to, `${nick} has been muted. May there be peace.`);
                app.Ignore.push(lowerCaseNick);
                storage.setItemSync('ignore', app.Ignore);
            } else app.say(to, `${nick} has either already been muted, or is an Administrator and is beyond my control`);
        }
    });

    // Unmute a user
    app.Commands.set('unmute', {
        desc: 'Un-mute a user',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            if (!text) {
                app.say(to, 'You need to specify a user');
                return;
            }

            let [nick] = text.split(' ');
            let lowerCaseNick = _.toLower(nick);

            if (_.includes(app.Ignore, lowerCaseNick)) {
                app.say(to, `${nick} has been unmuted`);
                app.Ignore = _.without(app.Ignore, lowerCaseNick);
                storage.setItemSync('ignore', app.Ignore);
            } else app.say(to, `${nick} is not on the mute list`);
        }
    });

    // Get a list of muted users
    app.Commands.set('ignored', {
        desc: 'The Ignore list of muted users',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            app.say(to, '--- Ignore list ---');
            app.Ignore.forEach(user => app.say(to, _.upperFirst(user)));
            app.say(to, `For a total of: ${app.Ignore.length}`);
        }
    });

    // Return the script info
    return scriptInfo;
};
