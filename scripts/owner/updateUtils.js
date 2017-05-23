'use strict';
const scriptInfo = {
    name: 'Update Utilities',
    desc: 'Provides refresh (reloads scripts), update (pulls from git hub), and halt (terminates bot)',
    createdBy: 'IronY'
};
const _ = require('lodash');
const os = require('os');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const gitlog = require('gitlog');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');
const short = require('../lib/_getShortService')();

// Handle real time upgrades, updates, and restarts
// Commands: update reload halt
module.exports = app => {

    // Cycle the bot (quit process)
    const halt = (to, from) => {
        app.action(to, 'I will be restarting soon');
        // Defer for 5 seconds so everything has a chance to send
        app._ircClient.disconnect(`${from} has asked me if I could leave for a second and do something important, I shall return`, function () {
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
            silent: app.Config.bot.debug || false
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

            // Give initial feedback
            app.say(to, `I am now checking for upgrades ${from}`);

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

                // TODO Hold the last commit and grab all commits since
                const commit = _.first(commits);

                // Get the files involved in the last commit
                shell.exec(`git diff-tree --no-commit-id --name-only -r ${commit.abbrevHash}`, {
                    async: true,
                    silent: app.Config.bot.debug || false
                }, (diffCode, diffFiles, diffErr) => {
                    // Something went wrong
                    if (diffCode !== 0 || _.isEmpty(diffFiles)) {
                        logger.error('Was unable to read the commit ', {
                            diffCode,
                            diffFiles,
                            diffErr,
                        });
                        app.say(to, 'I was unable to read the commit log');
                        return;
                    }

                    // Decide if this is a reload or cycle
                    let shouldCycle = false;
                    // Should we do a NPM/Yarn Install
                    let shouldInstallPackages = false;
                    // Do we have a yarn file
                    const hasYarnLock = fs.existsSync(path.resolve(process.cwd()), 'yarn.lock');
                    // Files affected from last commit
                    const files = _.compact(diffFiles.split(os.EOL));

                    // Check updated files
                    for (let file of files) {
                        // Should we update npm packages
                        if (_.startsWith(file, 'package.json') || (_.startsWith(file, 'yarn.lock') && hasYarnLock)) shouldInstallPackages = true;
                        // Check if we have any non scripts
                        if (!_.startsWith(file, 'scripts') && _.endsWith(file, '.js')) shouldCycle = true;
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
                            if (shouldInstallPackages) {
                                // Determine the package manager to use
                                let pkgManager = null;
                                if (shell.which('yarn') && hasYarnLock) pkgManager = 'yarn';
                                else if (shell.which('npm')) pkgManager = 'npm';
                                else {
                                    logger.error(`Cannot find package manager during upgrade`);
                                    app.say(to, `I am afraid we are missing the package manager ${from}`);
                                    return;
                                }

                                // Get uppercase representation
                                const pkgStr = pkgManager.toUpperCase();

                                // Report back to IRC
                                app.say(to, `Running ${pkgStr}`);

                                // Execute the shell command
                                shell.exec(`${pkgManager} upgrade`, {
                                    async: true,
                                    silent: app.Config.bot.debug || false
                                }, (npmCode, npmStdOut, npmStdErr) => {
                                    // Something went wrong updating packages
                                    if (npmCode !== 0) {
                                        // Log Error
                                        const errMsg = `Something went wrong running ${pkgStr} upgrade`;
                                        logger.error(errMsg, {
                                            npmStdErr,
                                            npmStdErr,
                                            npmStdOut
                                        });
                                        // Announce error
                                        app.say(to, errMsg);
                                        return;
                                    }

                                    // Run Secure
                                    app.say(to, 'Securing...');
                                    shell.exec(`npm run snyk-protect`, {
                                      async: true,
                                      silent: app.Config.bot.debug || false
                                    }, (snykCode, snykStdOut, snykStdErr) => {
                                      // Something went wrong running snyk
                                      if (snykCode !== 0) {
                                        // Log Error
                                        logger.error('Something went wrong securing packages with Snyk', {
                                          snykCode,
                                          snykStdOut,
                                          snykStdErr
                                        });
                                        // Report error
                                        app.say(to, `Something went wrong securing my modules!`);
                                        return;
                                      }

                                      // Report success
                                      app.action(to, `is very much in his safe space`);
                                      // Halt
                                      halt(to, from);
                                    });
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
