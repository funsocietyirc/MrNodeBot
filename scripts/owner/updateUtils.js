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
const typo = require('../lib/_ircTypography');
const short = require('../lib/_getShortService')();
const shell = require('shelljs');
const gitlog = require('gitlog');
const logger = require('../../lib/logger');

// Handle real time upgrades, updates, and restarts
// Commands: update reload halt
module.exports = app => {

    /* Helpers */
    const execSettings = () => Object.assign({}, {
        async: true,
        silent: app.Config.bot.debug || false
    });

    // Perform Secure Operation via Snyk
    const protect = () => new Promise((resolve, reject) => shell.exec(`npm run snyk-protect`, execSettings(), (code, stdOut, stdErr) => {
        // Something went wrong running snyk
        if (code !== 0) {
            // Log Error
            logger.error('Something went wrong securing packages with Snyk', {code, stdOut, stdErr});
            return reject(new Error(`Something went wrong securing my modules!`));
        }

        // Everything went fine
        resolve({stdCode: code, stdOut: stdOut, stdErr: stdErr});
    }));

    // Pull From Source Control
    const pullFromGit = () => new Promise((resolve, reject) => shell.exec('git pull', execSettings(), (code, stdOut, stdErr) => {
        // The Code did not exit properly
        if (code !== 0) {
            logger.error('Something went wrong during pull request in the update command', {code, stdOut, stdErr});
            return reject(new Error('Something went wrong with the pull request'));
        }

        // Everything went fine
        resolve({stdCode: code, stdOut: stdOut, stdErr: stdErr});
    }));

    // Update packages
    const updatePackages = pkgManager => new Promise((resolve, reject) => shell.exec(pkgManager === 'yarn' ? 'yarn' : `${pkgManager} install`, execSettings(), (code, stdOut, stdErr) => {
        // Something went wrong updating packages
        if (code !== 0) {
            // Log Error
            const errMsg = `Something went wrong running ${pkgManager.toUpperCase()} install`;
            logger.error(errMsg, {code, stdErr, stdOut});
            return reject(new Error(errMsg));
        }

        // Everything went well
        resolve({stdCode: code, stdOut: stdOut, stdErr: stdErr});
    }));

    // Fetch the git log
    const getGitLog = () => new Promise((resolve, reject) => gitlog(app.Config.gitLog, (error, commits) => {
        if (error) {
            logger.error('Something went wrong during the get git log process in the update command', {error});
            return reject(new Error('Something went wrong during the get git log process in the update command'));
        }
        resolve(commits);
    }));

    // Check Diff
    const checkDiff = abbrevHash => new Promise((resolve, reject) => shell.exec(`git diff-tree --no-commit-id --name-only -r ${abbrevHash}`, execSettings(), (code, stdOut, stdErr) => {
        // Something went wrong
        if (code !== 0 || _.isEmpty(stdOut)) {
            logger.error('Was unable to read the commit ', {code, stdOut, stdErr});
            return reject(new Error('I was unable to read the commit log'));
        }
        // Everything went ok
        resolve({stdCode: code, stdOut: stdOut, stdErr: stdErr});
    }));

    /* Commands */

    // Cycle the bot (quit process)
    const halt = (to, from, message) => {
        app.action(to, 'will be restarting soon');
        // Defer for 5 seconds so everything has a chance to send
        app._ircClient.disconnect(message || `${from} has asked me if I could leave for a second and do something important, I shall return`, () => process.exit());
    };

    // Reload the bots scripts
    const reload = (to, from) => {
        app.action(to, 'is feeling so fresh and so clean');
        app.Bootstrap(false);
    };

    const lockFileName = 'updating.lock';

    // Is Locked
    const isLocked = () => new Promise(res => fs.lstat(lockFileName, err => res(!err)));

    // Enable a lock
    const lock = (to, from) => new Promise(res => fs.writeFile(lockFileName, `${from} / ${to} / ${Date.now()}`, err => res(!err)));

    // Disable a lock
    const unlock = () => new Promise(res => fs.unlink(lockFileName, err => res(!err)));

    // Forcefully remove the unlock file;
    const forceUnlockCommand = async (to, from, text, message) => {
        const lockStatus = await isLocked();

        if(!lockStatus) {
            app.say(to, `Updates are not currently locked, ${from}`);
            return;
        }
        const unlockStatus = await unlock();
        app.say(to, !unlockStatus ? `Something went wrong removing the updates lockfile, ${from}` : `I have removed the updates lock file ${from}`);
    };
    app.Commands.set('update-force-unlock', {
        desc: 'Remove the updates lock file',
        access: app.Config.accessLevels.owner,
        call: forceUnlockCommand
    });


    // Update the bot
    const updateCommand = async (to, from, text, message) => {
        // Log failed attempts removing the lock file
        const attemptUnlock = () => {
            const unlockStatus = unlock();
            if(!unlockStatus) logger.error('Error removing the lock file for updates', {
                message: err.message || ''
            });
        };

        // Does a lock file exists
        const locked = await isLocked();

        if (locked) {
            app.say(to, `I am sorry ${from}, updates are currently locked`);
            return;
        }

        // Die if there is no git available
        if (!shell.which('git')) {
            logger.error('Unable to locate git on host to perform update');
            app.say(to, 'Can not update, Git is not available on the host');
            return;
        }

        // Check Lock
        const lockStatus = await lock(from, to);

        /// Verify the lock file
        if (!lockStatus) {
            app.say(to, `Someone else is currently running an update, ${from}`);
            return;
        }


        // Pull From Git
        let committed;

        try {
            committed = await pullFromGit();
        } catch (err) {
            attemptUnlock();
            app.say(to, err.message);
            return;
        }

        // No updates available
        if (_.isString(committed.stdOut) && _.includes(committed.stdOut.toLowerCase(), 'up-to-date')) {
            attemptUnlock();
            app.action(to, `is still lemony fresh, nothing to be done here`);
            return;
        }

        // Give initial feedback
        app.action(to, `is now forecasting the clouds for new data`);

        // Grab the commits
        let commits;
        try {
            commits = await getGitLog();
        } catch (err) {
            attemptUnlock();
            app.say(to, err.message);
            return;
        }

        // No Commits found
        if (_.isUndefined(commits) || _.isEmpty(commits) || !_.isArray(commits) || _.isEmpty(commits)) {
            attemptUnlock();
            app.say(to, 'Something went wrong finding the last commit');
            logger.error(`Something went wrong finding the last commit data in updateUtils.js`);
            return;
        }

        // Grab the last commit
        const commit = _.first(commits);

        // Grab the diff results
        let diffResults;
        try {
            diffResults = await checkDiff(commit.abbrevHash);
        } catch (err) {
            attemptUnlock();

            logger.error('Something went wrong diffing results in the updateUtils', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, err.message);
            halt(to, from, `I am unsure why I am in need of a restart, but I am!`);
            return;
        }

        // No Diff results found
        if (!diffResults || _.isEmpty(diffResults.stdOut)) {
            attemptUnlock();
            app.action(to, 'was unable to read the commit log');
            return;
        }

        // Decide if this is a reload or cycle
        let shouldCycle = false;

        // Should we do a NPM/Yarn Install
        let shouldInstallPackages = false;

        // Do we have a yarn file
        const hasYarnLock = fs.existsSync(path.resolve(process.cwd()), 'yarn.lock');

        // Files affected from last commit
        const files = _.compact(diffResults.stdOut.split(os.EOL));

        // Check updated files
        for (let file of files) {
            // Should we update npm packages
            if (_.startsWith(file, 'package.json') || (_.startsWith(file, 'yarn.lock') && hasYarnLock)) {
                shouldInstallPackages = true;
                shouldCycle = true;
            } else if (!_.startsWith(file, 'scripts') && _.endsWith(file, '.js')) {
                shouldCycle = true;
            }
        }

        // fetch the short url
        let url;
        try {
            url = await short(`${app.Config.project.repository.url}/commit/${commit.abbrevHash}`);
        } catch (err) {
            logger.error(`Error getting short url in update utils`, {
                message: err.message || '',
                stack: err.stack || ''
            });
            url = `${app.Config.project.repository.url}/commit/${commit.abbrevHash}`;
        }

        // Build Output
        let output = new typo.StringBuilder();
        output.appendBold('Update').append(commit.subject).append(commit.authorDateRel).append(url);
        app.say(to, output.text);

        // Update Modules
        if (shouldInstallPackages) {
            // Determine the package manager to use
            let pkgManager;
            if (shell.which('yarn') && hasYarnLock)
                pkgManager = 'yarn';
            else if (shell.which('npm'))
                pkgManager = 'npm';
            else {
                attemptUnlock();
                logger.error(`Cannot find package manager during upgrade`);
                app.say(to, `I am afraid we are missing the package manager, ${from}`);
                return;
            }

            // Run the package manager, hold results
            app.say(to, `Running ${pkgManager.toUpperCase()}`);
            let pkgResults;
            try {
                await updatePackages(pkgManager);
            } catch (err) {
                attemptUnlock();
                app.say(to, err.message);
                return;
            }

            // Secure via synk
            app.action(to, `is getting all up in his safe space`);
            let secureResults;
            try {
                await protect();
            } catch (err) {
                attemptUnlock();
                app.say(to, err.message);
                return;
            }

            // Halt
            attemptUnlock();
            halt(to, from, output.text);
        } else if (shouldCycle) { // Halt the process
            attemptUnlock();
            halt(to, from, output.text);
        } else {
            attemptUnlock();
            reload(to, from); // Reload scripts
        }
    };

    // Update only works in production as to not git pull away any new changes
    app.Commands.set('update', {
        desc: 'Hot swap out the Bot, if hard is specified it will do a hard reboot',
        access: app.Config.accessLevels.owner,
        call: updateCommand
    });

    // Terminate the bot
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
    app.Commands.set('reload', {
        desc: 'Live reload the Bot from local storage',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            app.reloadConfiguration();
            reload(to, from);
        }
    });

    // Secure
    app.Commands.set('secure', {
        desc: 'Secure the project using snyk',
        access: app.Config.accessLevels.owner,
        call: async (to, from, text, message) => {
            try {
                const secureResults = await protect();
                app.action(to, 'successfully secured modules!')
            } catch (err) {
                app.say(`Something went wrong securing my modules`);
            }
        }
    });

    // Pull From git
    app.Commands.set('pull', {
        desc: 'Pull the Bot from source',
        access: app.Config.accessLevels.owner,
        call: async (to, from, text, message) => {
            try {
                const pullResults = await pullFromGit();
                app.action(to, 'has successfully pulled himself from source!');
            }
            catch (err) {
                app.say(to, err.message);
            }
        }
    });

    // Return the script info
    return scriptInfo;
};
