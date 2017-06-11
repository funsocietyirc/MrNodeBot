'use strict';

// MrNodeBot
const _ = require('lodash');
const fs = require('fs');
const Bot = require('./bot');
const args = require('minimist')(process.argv.slice(2));
const logger = require('./lib/logger');

// Check if specified config file exists
if (_.isObject(args.config)) {
    fs.access(args.config, fs.F_OK, err => {
        if (err) {
            logger.warn('The config file you specified does not exist, defaulting to config.js');
            process.exit(0);
        }
    });
}

const bot = new Bot(app => {
    // Set the ENV Flag for Request strict TLS
    if (!_.isUndefined(app.Config.bot.strictTLS) || !app.Config.bot.strictTLS) process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    // Extend the max socket listeners
    process.setMaxListeners(0);

    // Code here will be executed after the bot is finished connecting
    if (process.stdin.setRawMode) process.stdin.setRawMode(true);

    // Hook into control-c termination
    process.stdin.on('data', b => {
        if (b[0] === 3) {
            // No Connection, Halt
            if (!app._ircClient.conn) process.exit();
            // Currently connected, terminate connection first
            else app._ircClient.disconnect('I have been terminated from the Console. Goodbye cruel world...', () => {
                // disconnect complete, end process
                if (process.stdin.setRawMode) process.stdin.setRawMode(false);
                process.exit();
            });
        }
    });

}, args.config);
