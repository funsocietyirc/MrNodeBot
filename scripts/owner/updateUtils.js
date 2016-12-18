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
const short = require('../lib/_getShortService');
/**
  Handle real time upgrades, updates, and restarts
  Commands: update reload halt
**/
module.exports = app => {

    // Cycle the bot (quit process)
    const halt = (to, from) => {
        app.action(to, 'I will be restarting soon');
        // Defer for 5 seconds so everything has a chance to send
        app._ircClient.disconnect(`${from} has asked me if I could leave for a second and do something important, I shall return`, function() {
            process.exit();
        });
    };

    // Reload the bots scripts
    const reload = (to, from) => {
        app.action(to, 'is feeling so fresh and so clean');
        app.Bootstrap(false);
    };

    // Pull code from github
    const updateCommand = (to, from, text, message) => {
        // Die if there is no git available
        if (!shell.which('git')) {
            logger.error('Unable to locate git on host to perform update');
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
                logger.error('Something went wrong during pull request in update command', {
                    stderr
                });
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
                if (error || _.isUndefined(commits) || _.isEmpty(commits) || !_.isArray(commits) || _.isEmpty(commits)) {
                    logger.error('Was unable to find last commit during update', {
                        err
                    });
                    app.say(to, 'Something went wrong finding the last commit');
                    return;
                }

                let commit = _.first(commits);

                // Get the files involved in the last commit
                shell.exec(`git diff-tree --no-commit-id --name-only -r ${commit.abbrevHash}`, {
                    async: true,
                    silent: app.Config.bot.debug || false
                }, (diffCode, diffFiles, diffErr) => {
                    // Something went wrong
                    if (diffCode !== 0 || _.isEmpty(diffFiles)) {
                        logger.error('Was unable to read the commit ', {
                            diffCode,
                            diffFiles
                        });
                        app.say(to, 'I was unable to read the commit log');
                        return;
                    }

                    // Decide if this is a reload or cycle
                    let shouldCycle = false;
                    let shouldNpm = false;
                    let files = _.compact(diffFiles.split(os.EOL));

                    // Check if we have any non scripts
                    for (let file of files) {
                        if (!_.startsWith(file, 'scripts') && _.endsWith(file, '.js')) {
                            shouldCycle = true;
                            break;
                        }
                    }

                    // Should we update npm packages
                    for (let file of files) {
                        if (_.startsWith(file, 'package.json')) {
                            shouldNpm = true;
                            break;
                        }
                    }

                    // begin shorten chain
                    short(`${app.Config.project.repository.url}/commit/${commit.abbrevHash}`)
                        .then(shortUrl => {
                            let output = new typo.StringBuilder();
                            output.appendBold('Maeve mode activated')
                                .append(commit.subject)
                                .append(commit.authorDateRel)
                                .append(shortUrl);
                            app.say(to, output.text);

                            // Update NPM Modules
                            if (shell.which('npm') && shouldNpm) {
                                app.say(to, 'Running NPM install..');
                                shell.exec('npm install', {
                                    async: true,
                                    silent: app.Config.bot.debug || false
                                }, (npmCode, npmStdOut, npmStdErr) => {
                                    if (npmCode !== 0) {
                                        logger.error('Something went wrong running NPM update', {
                                            npmStdErr
                                        });
                                        app.say(to, 'Something went wrong running NPM update');
                                        return;
                                    }
                                    halt(to, from);
                                });
                            }
                            // Final check
                            else {
                                if (shouldCycle) halt(to, from);
                                else reload(to, from);
                            }
                        })
                        .catch(err => {
                            logger.error('Something went wrong in the update utils shorten chain', {
                                err
                            });
                            app.say(to, 'Something went wrong getting the short link for the last commit');
                        });
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

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('halt', {
        desc: 'Halt and catch fire (Quit bot / watcher proc)',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => halt(to, from)
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
        call: (to, from, text, message) => reload(to, from)
    });

    // Reload both the scripts and the Config
    // Live reload the scripts
    app.Commands.set('reload', {
        desc: 'Live reload the Bot from local storage',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app.reloadConfiguration();
            reload(to, from);
        }
    });

    // Return the script info
    return scriptInfo;
};
