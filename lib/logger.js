const _ = require('lodash');
const config = require('../config');
const rotate = require('winston-daily-rotate-file');
const winston = require('winston');

const logger = winston.createLogger({
    exitOnError: false,
    transports: [
        new (winston.transports.DailyRotateFile)({
            name: 'info-file',
            filename: 'logs/info.log',
            level: 'info',
            tailable: true,
            maxsize: 20000,
            zippedArchive: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.splat(),
                winston.format.json(),
            ),
        }),
        new (winston.transports.DailyRotateFile)({
            name: 'error-file',
            filename: 'logs/error.log',
            level: 'warn',
            prettyPrint: true,
            maxsize: 20000,
            zippedArchive: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.splat(),
                winston.format.json(),
            ),
        }),
    ],
    // Record exceptions in normal file
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'logs/exceptions.log',
        }),
    ],
});

// Log to console if we are in debug mode
if (config.bot.debug === true && process.env.NODE_ENV !== 'test') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.splat(),
            winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
        ),
        name: 'console',
        level: config.bot.debugLevel || 'info',
    }));
}

module.exports = logger;
