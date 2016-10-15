'use strict';
/**
  MrNodeBot
**/

const fs = require('fs');
const conLogger = require('./lib/consoleLogger');
const args = require('minimist')(process.argv.slice(2));

// Check if specified config file exists
if (args.config) {
    fs.access(args.config, fs.F_OK, err => {
        if (err) {
            conLogger('The config file you specified does not exist, defaulting to config.js', 'danger');
            return;
        }
    });
}

const MrNodeBot = require('./bot')((app) => {
  console.log(require('util').inspect(app, null, 10));
    // Code here will be executed after the bot is finished connecting
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('data', (b) => {
        if (b[0] === 3) {
            app._ircClient.disconnect('I have been terminated from the Console. Goodbye cruel world...', () => {
                if (process.stdin.setRawMode) {
                    process.stdin.setRawMode(false);
                }
                process.exit();
            });
        }
    });
}, args.config);
