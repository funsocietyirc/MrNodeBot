'use strict';
const scriptInfo = {
    name: 'admin',
    file: 'admin.js',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const color = require('irc-colors');
const storage = require('node-persist');
const helpers = require('../../helpers');

/**
  Administrator List manipulationr
  Commands: admin [list add del help]
**/
module.exports = app => {
    const admin = (to, from, text, message) => {
        let textArray = text.split(' ');
        let [cmd, user] = textArray;
        cmd = cmd || 'help';
        user = _.toLower(user) || false;

        if((cmd === 'add' || cmd === 'del') && !user) {
          app.say(from, 'You need to specify a user');
          return;
        }

        switch (cmd) {
            // List administrators
            case 'list':
                app.say(from, helpers.TitleLine('Administrators:'));
                app.Admins.forEach(admin => {
                    app.say(from, admin);
                });
                break;
                // Get Administrative commands
            case 'help':
                app.say(from, helpers.TitleLine(`${app._ircClient.nick} has the following administrative commands available.`));

                app.Commands.forEach((value, key) => {
                    if (app.Commands.get(key).access === app.Config.accessLevels.admin) {
                        app.say(from, `${color.bgwhite.black.bold(key)} --- ${helpers.ColorHelpArgs(value.desc)}`);
                    }
                });
                break;
            case 'add':
                // Exit if already an administrator
                if (_.includes(app.Admins, user)) {
                    app.say(from, `${user} is already an Administrator`);
                    return;
                }
                app.Admins.push(user.toLowerCase());
                storage.setItemSync('admins', app.Admins);
                app.say(from, `${user} is now an Administrator`);
                app.say(user, helpers.ColorHelpArgs('Hey there, you are now an Administrator. use [admin help] to get commands'));
                break;
            case 'del':
                let cappedUser = _.capFirst(user);
                // Exit if already an administrator
                if (!_.includes(app.Admins, user)) {
                    app.say(from, `${cappedUser} is not currently an Administrator`);
                    return;
                }
                // Exit if trying to remove owner
                if (user == _.toLower(app.Config.owner.nick)) {
                    app.say(from, `You cannot remove ${cappedUser} because ${cappedUser} owns me..`);
                    return;
                }

                // Everything checked out
                app.Admins = _.without(app.Admins, user);
                storage.setItemSync('admins', app.Admins);
                app.say(from, `${user} is no longer an Administrator`);
                break;
        }
    };

    app.Commands.set('admin', {
        desc: '[command] [user?] list add del help',
        access: app.Config.accessLevels.admin,
        call: admin
    });
    // Return the script info
    return scriptInfo;
};
