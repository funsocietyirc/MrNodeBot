'use strict';
const scriptInfo = {
    name: 'Update Utilities',
    desc: 'Provides refresh (reloads scripts), update (pulls from git hub), and halt (terminates bot)',
    createdBy: 'IronY'
};

const _ = require('lodash');
const os = require('os');
const shell = require('shelljs');
const gitlog = require('gitlog');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');

/**
  Handle real time upgrades, updates, and restarts
  Commands: update reload halt
**/
module.exports = app => {

    const cycle = to => {
        app.say(to, 'I will be back!');
        // Delay so the bot has a chance to talk
        setTimeout(() => {
            app.Bootstrap(true);
        }, 2000);
    };

    const reload = to => {
        app.action(to, 'is feeling so fresh and so clean');
        app.Bootstrap(false);
    };

    const halt = to => {
        app.action(to, 'is meltttinggg.....');
        app._ircClient.disconnect();
        process.exit(42);
    };

    // Update command handler
    const updateCommand = (to, from, text, message) => {
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

            // No updates available
            if (_.isString(stdout) && _.includes(stdout.toLowerCase(), 'up-to-date')) {
                app.say(to, 'I am still lemony fresh, no update required');
                return;
            }


            // Perform GitLog for last commit
            gitlog(app.Config.gitLog, (error, commits) => {
                // Something went wrong
                if (error || _.isUndefined(commits) || _.isEmpty(commits) || !_.isString(commits[0].abbrevHash)) {
                    app.say(to, 'Something went wrong finding the last commit');
                    return;
                }

                let commit = commits[0];

                // Get the files involved in the last commit
                shell.exec(`git diff-tree --no-commit-id --name-only -r ${commit.abbrevHash}`, {
                    async: true,
                    silent: app.Config.bot.debug || false
                }, (diffCode, diffFiles, diffErr) => {
                    // Something went wrong
                    if (diffCode !== 0 || _.isEmpty(diffFiles)) {
                        app.say(to, 'Could not get a read out the last commit');
                        return;
                    }
                    // Decide if this is a reload or cycle
                    let shouldCycle = false;
                    let shouldNpm = false;
                    let files = _.compact(diffFiles.split(os.EOL));

                    // Check if we have any non scripts
                    for (let file of files) {
                        if (!_.startsWith(file, 'scripts')) {
                            shouldCycle = true;
                            break;
                        }
                    }

                    // Should we update npm packages
                    for (let file of files) {
                        if (_.startsWith(file, 'package.json')) {
                            shouldNpm = true;
                        }
                    }

                    let output = new typo.StringBuilder();
                    output.appendBold('Found Update')
                        .apped(commit.subject)
                        .append(commit.authorDateRel)
                        .append(`${app.Config.project.repository.url}/commit/${commit.abbrevHash}`);

                        app.say(to, 'hello')
                        console.dir(output);

                    // Report we found an update
                    app.say(to, output.toString());

                    if (shouldNpm) {
                        app.say(to, 'Running NPM install..');
                        shell.exec('npm install', {
                            async: true,
                            silent: app.Config.bot.debug || false
                        }, (npmCode, npmStdOut, npmStdErr) => {
                            if (npmCode !== 0) {
                                app.say(to, 'Something went wrong running the NPM update');
                                return;
                            }
                            cycle(to);
                        });
                    }
                    // Final check
                    else {
                        if (shouldCycle) cycle(to);
                        else reload(to);
                    }
                });

            });
        });
    };

    // Update only works in production as to not git pull away any new changes
    app.Commands.set('update', {
        desc: 'Hot swap out the Bot, if hard is specified it will do a hard reboot',
        access: app.Config.accessLevels.owner,
        call: updateCommand
    });

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
            reload();
        }
    });

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('halt', {
        desc: 'Halt and catch fire (Quit bot / watcher proc)',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => halt(to)
    });

    // Return the script info
    return scriptInfo;
};
