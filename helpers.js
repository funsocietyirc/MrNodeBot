'use strict';
// Includes
const moment = require('moment');
const logger = require('./lib/logger');
const c = require('irc-colors');
const _ = require('lodash');
const startTime = moment();

// String representation of access level
const AccessString = str => {
    switch (str) {
        case 0:
            return 'Guest';
        case 1:
            return 'Identified';
        case 2:
            return 'Administrator';
        case 3:
            return 'Owner';
        case 4:
            return 'ChannelOp';
        case 5:
            return 'ChannelVoice';
        case 6:
            return 'ChannelOpIdentified';
        case 7:
            return 'ChannelVoiceIdentified';
        default:
            logger.error(`Unknown command type ${str} used`);
            return 'Unknown';
    }
};

/* Get the current uptime */
const StartTime = startTime;

/* Color stuffs */
const ColorHelpArgs = text => text.replaceAll('[', c.red.bold('[')).replaceAll(']', c.red.bold(']'));
const RedSlashes = text => text.replaceAll('/', c.red.bold('/'));
const TitleLine = text => c.white.bold.bgblack(text);

// Basical pluralization
const Plural = (text, number) => number > 1 || number === 0 ? text + 's' : text;

// Strip new lines
const StripNewLine = text => text.replace(/(?:\r\n|\r|\n)/g, ' ');

// Round numbers
const RoundNumber = (num, decimals) => {
    decimals = decimals || 2;
    var t = Math.pow(10, decimals);
    return (Math.round((num * t) + (decimals > 0 ? 1 : 0) * (Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
};

// Rot 13
const Rot13 = text => text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));

// Comma deliminate numbers at 3 digits
const NumberWithCommas = x => {
    // We were given no input, return 0
    if (_.isUndefined(x)) return '0';
    // The object has a to string method, call it
    if (_.isFunction(x.toString)) x = x.toString();
    // We do not have a valid string, log error and continue
    if (!_.isString(x)) logger.error('Error in NumberWithCOmmas helper, X is not a valid string, or object that can be cast as a string', {
        x
    });
    // Return the replacement
    return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Regular Expressions
const ValidHostExpression = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
const RemoveNonPrintChars = /[\u0002\u001F\u0016\u0003\u000F]/g;
const FakeSpaceChars = /[\u0009\u000A\u000B\u000C\u000D\u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2029\u202F\u205F\u3000\u180E\u200B\u200C\u200D\u2060\uFEFF]/g;

// Export
module.exports = {
    FakeSpaceChars,
    RemoveNonPrintChars,
    ValidHostExpression,
    NumberWithCommas,
    Rot13,
    RoundNumber,
    StripNewLine,
    Plural,
    TitleLine,
    RedSlashes,
    ColorHelpArgs,
    StartTime,
    AccessString
};
