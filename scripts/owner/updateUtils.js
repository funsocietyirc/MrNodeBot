'use strict';
const scriptInfo = {
    name: 'Update Utilities',
    desc: 'Provides refresh (reloads scripts), update (pulls from git hub), and halt (terminates bot)',
    createdBy: 'IronY'
};

const shell = require('shelljs');
const _ = require('lodash');

/**
  Handle real time upgrades, updates, and restarts
  Commands: update reload halt
**/
module.exports = app => {

    // Reload the configuration object
    app.Commands.set('reload-config', {
        desc: 'Reload the configuration object',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app.reloadConfiguration();
            app.action(to, 'has finished changing his mind');
        }
    });

    // Live reload the scripts
    app.Commands.set('reload-scripts', {
        desc: 'Live reload the Bot from local storage',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app.Bootstrap(false);
            app.action(to, 'has finished reloading his thoughts');
        }
    });

    // Reload both the scripts and the Config
    // Live reload the scripts
    app.Commands.set('reload', {
        desc: 'Live reload the Bot from local storage',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app.reloadConfiguration();
            app.Bootstrap(false);
            app.action(to, 'is feeling so fresh and so clean');
        }
    });

    // Update only works in production as to not git pull away any new changes
    app.Commands.set('update', {
        desc: 'Hot swap out the Bot, if hard is specified it will do a hard reboot',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            let textArray = text.split(' ');
            let [target] = textArray;
            target = target || 'soft'; // Defult to soft update

            // Die if there is no git available
            if (!shell.which('git')) {
                app.say(to, 'Can not update, Git is not available on the host');
                return;
            }
            // Die if something goes wrong with git pull
            if (shell.exec('git pull').code !== 0) {
                app.say(to, 'Something went wrong with the pull request');
                return;
            }

            // Parse any additional arguments
            switch (target) {
                case 'cycle':
                    app.say(to, 'I will be back!');
                    // Delay so the bot has a chance to talk
                    setTimeout(() => {
                        app.Bootstrap(true);
                    }, 2000);
                    break;
                default:
                    app.action(to, 'is feeling so fresh and so clean');
                    app.Bootstrap(false);
                    break;
            }
        }
    });

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('halt', {
        desc: 'Halt and catch fire (Quit bot / watcher proc)',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app._ircClient.disconnect();
            process.exit(42);
        }
    });

    // Return the script info
    return scriptInfo;
};
