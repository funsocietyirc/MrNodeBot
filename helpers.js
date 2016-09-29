'use strict';
const moment = require('moment');
const c = require('irc-colors');
const startTime = moment();

require('moment-countdown');

exports.smartHttp = (function() {
  var url = require('url'),
    adapters = {
      'http:': require('http'),
      'https:': require('https'),
    };
  return function(inputUrl) {
    return adapters[url.parse(inputUrl).protocol]
  }
}());

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

/**
 * @returns {boolean}
 * @param x
 * @constructor
 */
exports.IsSet = x => !!(x != undefined && x != null && x != '');


/* Color stuffs */
exports.ColorHelpArgs = text => text.replaceAll('[', c.red.bold('[')).replaceAll(']', c.red.bold(']'));
exports.RedSlashes = text => text.replaceAll('/', c.red.bold('/'));
exports.TitleLine = text => c.bgblack.white.bold(text);
