'use strict';
const moment = require('moment');
const c = require('irc-colors');
const startTime = moment();

require('moment-countdown');

exports.timeFormat = d => {
    var months = d.get('months'),
        days = d.get('days'),
        output = '';

    if (months) {
        let first = c.black.bold.bgwhite(` ${months} `);
        output += `${first} ${'Month'.plural(months)} `;
    }

    if (days) {
        let first = c.black.bold.bgwhite(' {0} '.format(days));
        output += `${first} ${'Day'.plural(days)}`;
    }

    return output;
};

// String representation of access level
exports.accessString = str => {
    switch (str) {
        case 0:
            return 'Guest';
        case 1:
            return 'Identified';
        case 2:
            return 'Administrator';
        case 3:
            return 'Owner'
    }
};

/* Get the difference between now and the current time */
exports.timeDiff = time => moment.duration(moment(time, 'DD/MM/YYYY').diff(moment()));

/* Get the current uptime */
exports.Uptime = () => startTime.toString();

exports.isSet = function (x) {
    if (x != undefined && x != null && x != '') {
        return true;
    }
};


/* Color stuffs */
exports.ColorHelpArgs = text => text.replaceAll('[', c.red.bold('[')).replaceAll(']', c.red.bold(']'));
exports.RedSlashes = text => text.replaceAll('/', c.red.bold('/'));
exports.TitleLine = text => c.white.bgblack.bold(text);
