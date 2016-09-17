'use strict';
const scriptInfo = {
    name: 'update',
    file: 'update.js',
    createdBy: 'Dave Richer'
};

const shell = require('shelljs');

/**
  Handle real time upgrades, updates, and restarts
  Commands: update reload halt
**/
module.exports = app => {
    const upgrade = (to, from, text, message) => {
        let target = text.getFirst() || 'soft'; // Default to soft update
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
    };

    const reload = (to, from, text, message) => {
        app.Bootstrap(false);
        app.action(to, 'Is feeling so fresh and so clean');
    };

    const halt = (to, from, text, message) => {
        app._ircClient.disconnect();
        process.exit(42);
    };

    // Update only works in production as to not git pull away any new changes
    app.Commands.set('update', {
        desc: 'Hot swap out the Bot, if hard is specified it will do a hard reboot',
        access: app.Config.accessLevels.owner,
        call: upgrade
    });

    // Live reload the scripts
    app.Commands.set('reload', {
        desc: 'Live reload the Bot from local storage',
        access: app.Config.accessLevels.owner,
        call: reload
    });

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('halt', {
        desc: 'Halt and catch fire (Quit bot / watcher proc)',
        access: app.Config.accessLevels.owner,
        call: halt
    });

    // Return the script info
    return scriptInfo;
};
