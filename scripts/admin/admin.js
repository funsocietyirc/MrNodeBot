'use strict';

const color = require('irc-colors');
const storage = require('node-persist');
const helpers = require('../../helpers');

/**
  Administrator List manipulationr
  Commands: admin [list add del help]
**/
module.exports = app => {
    const admin = (to, from, text, message) => {
        let txtArray = text.split(' ');
        let cmd = txtArray[0] || 'help';
        let user = txtArray[1] || false;

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
                if (!user) {
                    app.say(from, 'You need to specify a user');
                    return;
                }
                // Exit if already an administrator
                if (app.Admins.contains(user)) {
                    app.say(from, `${user} is already an Administrator`);
                    return;
                }
                app.Admins.push(user.toLowerCase());
                storage.setItemSync('admins', app.Admins);
                app.say(from, `${user} is now an Administrator`);
                app.say(user, helpers.ColorHelpArgs('Hey there, you are now an Administrator. use [admin help] to get commands'));
                break;
            case 'del':
                if (!user) {
                    app.say(from, 'You need to specify a user');
                    return;
                }
                // Exit if already an administrator
                if (!app.Admins.contains(user)) {
                    app.say(from, `${user} is not currently an Administrator`);
                    return;
                }
                // Exit if trying to remove owner
                if (String(user).toLowerCase() == String(app.Config.owner.nick).toLocaleLowerCase()) {
                    app.say(from, `You cannot remove ${user} because ${user} owns me..`);
                    return;
                }

                // Everything checked out
                app.Admins.splice(app.Admins.indexOf(user));
                storage.setItemSync('admins', app.Admins);
                app.say(from, `${user} is no longer an Administrator`);
                break;
        }
    };

    app.Commands.set('admin', {
        desc: '[command] list add del help',
        access: app.Config.accessLevels.admin,
        call: admin
    });
};
