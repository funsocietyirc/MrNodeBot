'use strict';
const scriptInfo = {
    name: 'admin',
    desc: 'Private Admin help, and Admin User management',
    createdBy: 'IronY'
};

const _ = require('lodash');
const t = require('../../lib/localize');

const color = require('irc-colors');
const storage = require('node-persist');
const helpers = require('../../helpers');

// Localizations
const i18next = require('../../lib/i18next');
i18next.addResources('en', 'admin', {
    needsUser: 'You need to specify a user',
    administrators: 'Administrators:',
    availableCommands: '{{- nick}} has the following Administrative commands available',
    alreadyAdmin: '{{- nick}} is already an Administrator',
    isNowAdmin: '{{- nick}} is now an Administrator',
    isNotAdmin: '{{- nick}} is not an Administrator',
    isNoLongerAdmin: '{{- nick}} is no longer an Administrator',
    cannotRemove: 'You cannot remove {{- nick}} because {{- nick}} is my owner',
    add: 'Hey there, you are now an Administrator. use [admin help] to get commands',
    help: '[command] [user?] list add del help',
    cannotAddBot: 'You cannot add me to the Administrator list, although I do appreciate it',
    noAdmins: 'There are currently no Administrators listed'
});

/**
  Administrator List manipulationr Commands: admin [list add del help]
**/
module.exports = app => {
    const admin = (to, from, text, message) => {
        let textArray = text.split(' ');
        let [cmd, user] = textArray;
        cmd = cmd || 'help';
        user = _.toLower(user) || false;

        if ((cmd === 'add' || cmd === 'del') && !user) {
            app.say(from, t('admin:needUser'));
            return;
        }

        switch (cmd) {
            // List administrators
            case 'list':
                if (!app.Admins.length) {
                    app.say(from, t('admin:noAdmins'));
                    return;
                }
                app.say(from, `${helpers.TitleLine(t('admin:administrators'))} ${_.map(app.Admins, _.capitalize).join(', ')}`);
                break;
                // Get Administrative commands
            case 'help':
                app.say(from,
                    t('admin:availableCommands', {
                        nick: helpers.TitleLine(app._ircClient.nick)
                    }));

                app.Commands.forEach((value, key) => {
                    if (app.Commands.get(key).access === app.Config.accessLevels.admin) app.say(from, `${color.bgwhite.black.bold(key)} --- ${helpers.ColorHelpArgs(value.desc)}`);
                });
                break;
                // Add Administrator
            case 'add':
                // Exit if already an administrator
                if (_.includes(app.Admins, user)) {
                    app.say(from, t('admin:alreadyAdmin', {
                        nick: user
                    }));
                    return;
                }

                // Adding the bot to the admin list
                if (user.toLowerCase() == app.nick.toLowerCase()) {
                    app.say(from, t('admin:cannotAddBot'));
                    return;
                }

                app.Admins.push(user.toLowerCase());
                storage.setItemSync('admins', app.Admins);

                app.say(from, t('admin:isNowAdmin', {
                    nick: user
                }));

                app.say(user, helpers.ColorHelpArgs(t('admin:add')));
                break;
                // Delete Administrator
            case 'del':
                if (user.toLowerCase() == app.nick.toLowerCase()) {
                    app.say(from, t('admin:cannotAddBot'));
                    return;
                }

                let cappedUser = _.capitalize(user);

                // Exit if already an administrator
                if (!_.includes(app.Admins, user)) {
                    app.say(from, t('admin:isNotAdmin', {
                        nick: cappedUser
                    }));
                    return;
                }

                // Exit if trying to remove owner
                if (user == _.toLower(app.Config.owner.nick)) {
                    app.say(from, t('admin:cannotRemove', {
                        nick: cappedUser
                    }));
                    return;
                }

                // Everything checked out
                app.Admins = _.without(app.Admins, user);
                storage.setItemSync('admins', app.Admins);

                app.say(from, t('admin:isNoLongerAdmin', {
                    nick: user
                }));
                break;
        }
    };

    app.Commands.set('admin', {
        desc: t('admin:help'),
        access: app.Config.accessLevels.admin,
        call: admin
    });

    // Return the script info
    return scriptInfo;
};
