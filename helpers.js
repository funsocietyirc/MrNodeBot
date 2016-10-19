'use strict';
const moment = require('moment');
const c = require('irc-colors');
const _ = require('lodash');
const startTime = moment();
const excuses = require('./lib/bofhExcuses');


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
const AccessString = exports.AccessString = str => {
    switch (str) {
        case 0:
            return 'Guest';
        case 1:
            return 'Identified';
        case 2:
            return 'Administrator';
        case 3:
            return 'Owner';
        default:
            return 'Unknown';
    }
};

/* Get a BOFH Excuse */
const Excuse = exports.Excuse = () => _.sample(excuses);

/* Get the difference between now and the current time */
const TimeDiff = exports.TimeDiff = time => moment.duration(moment(time, 'DD/MM/YYYY').diff(moment()));

/* Get the current uptime */
const UpTime = exports.Uptime = () => startTime.toString();

/* Color stuffs */
const ColorHelpArgs = exports.ColorHelpArgs = text => text.replaceAll('[', c.red.bold('[')).replaceAll(']', c.red.bold(']'));
const RedSlashes = exports.RedSlashes = text => text.replaceAll('/', c.red.bold('/'));
const TitleLine = exports.TitleLine = text => c.white.bold.bgblack(text);

// Basical pluralization
const Plural = exports.Plural = (text, number) => number > 1 || number === 0 ? text + 's' : text;

// Strip new lines
const StripNewLine = exports.StripNewLine = text => text.replace(/(?:\r\n|\r|\n)/g, ' ');

// Comma deliminate numbers at 3 digits
const NumberWithCommas = exports.NumberWithCommas = x =>  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Extract URLS From text
const ExtractUrls = exports.ExtractUrls = text => text.toString().match(/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig);

// Valid Host Expression
const ValidHostExpression = exports.ValidHostExpression = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
