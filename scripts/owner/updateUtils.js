'use strict';
const scriptInfo = {
    name: 'Update Utilities',
    desc: 'Provides refresh (reloads scripts), update (pulls from git hub), and halt (terminates bot)',
    createdBy: 'IronY'
};

const _ = require('lodash');
const shell = require('shelljs');
const gitlog = require('gitlog');
const logger = require('../../lib/logger');

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
            // Die if there is no git available
            if (!shell.which('git')) {
                app.say(to, 'Can not update, Git is not available on the host');
                return;
            }

            // Do git update
            shell.exec('git pull', {
                async: true,
                sielnt: app.Config.bot.debug || false
            }, (code, stdout, stderr) => {
                // The Code did not exit properly
                if (code !== 0) {
                    app.say(to, 'Something went wrong with the pull request');
                    return;
                }
                // Perform GitLog for last commit
                gitlog(app.Config.gitLog, (error, commits) => {
                    // Something went wrong
                    if (error || _.isUndefined(commits) || _.isEmpty(commits) || !_.isString(commits[0].abbrevHash)) {
                        app.say(to, 'Something went wrong finding the last commit');
                        return;
                    }

                    // Get the files involved in the last commit
                    shell.exec(`git diff-tree --no-commit-id --name-only -r ${commits[0].abbrevHash}`, {
                        async: true,
                        silent: app.Config.bot.debug || false
                    }, (code2, files, stderr2) => {
                        // Something went wrong
                        if (code2 !== 0 || _.isEmpty(files)) {
                            app.action(to, 'is feeling so fresh and so clean');
                            app.Bootstrap(false);
                            return;
                        }
                        // Decide if this is a reload or cycle
                        let shouldCycle = false;
                        // Iterate the results
                        for (let file of files) {
                            if (_.includes(file, 'scripts')) {
                                shouldCycle = true;
                                break;
                            }
                        }
                        if (!shouldCycle) {
                            app.action(to, 'is feeling so fresh and so clean');
                            app.Bootstrap(false);
                            return;
                        } else {
                            app.say(to, 'I will be back!');
                            // Delay so the bot has a chance to talk
                            setTimeout(() => {
                                app.Bootstrap(true);
                            }, 2000);
                        }
                    });

                });
            });

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
