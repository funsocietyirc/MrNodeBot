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
            level: 'info',
            prettyPrint: true,
            tailable: true,
            json: true,
            maxsize: 20000,
            zippedArchive: true,
        }),
        new(winston.transports.DailyRotateFile)({
            name: 'error-file',
            filename: 'logs/error.log',
            level: 'warn',
            prettyPrint: true,
            tailable: true,
            json: true,
            maxsize: 20000,
            zippedArchive: true,
        })
    ],
    // Record exceptions in normal file
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'logs/exceptions.log'
        })
    ]
});

// Log to console if we are in debug mode
if (config.bot.debug === true && process.env.NODE_ENV !== 'test')
    logger.add(winston.transports.Console, {
        name: 'console',
        timestamp: true,
        colorize: true,
        prettyPrint: true,
        depth: 4,
        level: config.bot.debugLevel || 'info',
    });


// Enable logio
if (!_.isObject(config.logio) && _.isBoolean(config.logio.enabled) && config.logio.enabled) {
    require('winston-logio-mirror');
    logger.add(winston.transports.Logio, {
        port: config.logio.port || 28777,
        node_name: config.logio.nodeName || 'MrNodeBot',
        host: config.logio.host || '127.0.0.1',
    });
}

module.exports = logger;
