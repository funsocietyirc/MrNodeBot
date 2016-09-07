'use strict';

const chalk = require('chalk');
const Moment = require('moment');

module.exports = (message, level) => {
    // No level provided
    level = level || '';
    // Decorate
    switch (level) {
        case 'success':
            message = chalk.bold.green(message);
            break;
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
    console.log(`${date} ${message}`);

    // Return the reformatted message
    return `${date} ${message}`;
};
