'use strict';
const moment = require('moment');
const c = require('irc-colors');
const startTime = moment();

const smartHttp = exports.smartHttp = (function() {
  var url = require('url'),
    adapters = {
      'http:': require('http'),
      'https:': require('https'),
    };
  return function(inputUrl) {
    return adapters[url.parse(inputUrl).protocol]
  }
}());

const leetSpeak = exports.leetSpeak = text => text.replace(/l|i/gi, '1').replace(/z/gi, '2').replace(/e/gi, '3').replace(/a/gi, '4').replace(/s/gi, '5').replace(/G/g, '6').replace(/t/gi, '7').replace(/b/gi, '8').replace(/g/g, '9').replace(/o/gi, '0');


const timeFormat = exports.timeFormat = d => {
    var months = d.get('months'),
        days = d.get('days'),
        output = '';

    if (months) {
        let first = c.black.bold.bgwhite(` ${months} `);
        output += `${first} ${Plural('Month',months)} `;
    }

    if (days) {
        let first = c.black.bold.bgwhite(` ${days} `);
        output += `${first} ${Plural('Day',days)}`;
    }

    return output;
};

// String representation of access level
const accessString = exports.accessString = str => {
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
const timeDiff = exports.timeDiff = time => moment.duration(moment(time, 'DD/MM/YYYY').diff(moment()));

/* Get the current uptime */
const UpTime = exports.Uptime = () => startTime.toString();

/**
 * @returns {boolean}
 * @param x
 * @constructor
 */
const IsSet = exports.IsSet = x => !!(x != undefined && x != null && x != '');


/* Color stuffs */
const ColorHelpArgs = exports.ColorHelpArgs = text => text.replaceAll('[', c.red.bold('[')).replaceAll(']', c.red.bold(']'));
const RedSlashes = exports.RedSlashes = text => text.replaceAll('/', c.red.bold('/'));
const TitleLine = exports.TitleLine = text => c.white.bold.bgblack(text);

// Basical pluralization
const Plural = exports.Plural = (text, number) => {
    return number > 1 || number === 0 ? text + 's' : text;
}
