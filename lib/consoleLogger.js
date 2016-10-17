'use strict';

const chalk = require('chalk');
const util = require('util');
const Moment = require('moment');
const _ = require('lodash');

module.exports = (message, level) => {
    // No level provided
    level = level || '';
    message = util.inspect(message, null, 4);
    // Decorate
    switch (level) {
        case 'success':
            message = chalk.bold.green(message);
            break;
        case 'danger':
        case 'error':
            message = chalk.bold.red(message);
            break;
        case 'info':
            message = chalk.bold.cyan(message);
            break;
        case 'loading':
            message = chalk.bold.yellow(message);
    }

    let date = chalk.bold.white(`[${Moment().format('hh:mm:ss a MMM Do YY')}]`);
    let formattedMessage = `${date} ${message}`;
    // Log to console
    console.log(formattedMessage);
    // Return the reformatted message
    return formattedMessage;
};
