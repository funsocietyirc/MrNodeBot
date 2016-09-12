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
            conLogger('The config file you specified does not exist, defaulting to config.js','danger');
            return;
        }
    });
}

const MrNodeBot = require('./bot')((app) => {
    // Code here will be executed after the bot is finished connecting
}, args.config);
