'use strict';

const _ = require('lodash');
const config = require('../config');
const rotate = require('winston-daily-rotate-file');
const winston = require('winston');

const logger = new(winston.Logger)({
    exitOnError: false,
    transports: [
        new(winston.transports.DailyRotateFile)({
            name: 'info-file',
            filename: 'logs/info.log',
            level: 'info'
        }),
        new(winston.transports.DailyRotateFile)({
            name: 'error-file',
            filename: 'logs/error.log',
            level: 'error',
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ]
});

// Log to console
if(config.bot.debug === true) {
  logger.add(winston.transports.Console, {
            name:'console',
            timestamp: true,
            colorize: true,
            prettyPrint: true,
            depth: 4,
            level: config.bot.debugLevel || 'info',
          });
}

// Enable logio
if(!_.isUndefined(config.logio) && config.logio.enabled === true) {
  require('winston-logio-mirror');
  logger.add(winston.transports.Logio, {
    port: config.logio.port || 28777,
    node_name: config.logio.nodeName || 'MrNodeBot',
    host: config.logio.host || '127.0.0.1',
    colorize: true,
    depth: 4,
    prettyPrint: true,
    timestamp: true,
  });
}

module.exports = logger;
