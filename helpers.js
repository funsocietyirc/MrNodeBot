'use strict';

/**
 * @module Helpers
 * @author Dave Richer
 */
const moment = require('moment');
const c = require('irc-colors');
const _ = require('lodash');

/**
 * AccessString - Get A String representation of a Access Level
 * @param {string} str Number value of the access string
 * @returns {string} A String representation of the access value
 */
const AccessString = module.exports.AccessString = str => {
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
            return 'Unknown';
    }
};

/** Start Time in moment format */
const StartTime = module.exports.StartTime = moment();

/* Color stuffs */

/**
 * ColorHelpArgs - Colorize brackets
 * @param {string} text Unformatted String
 * @returns {string} Unformatted String
 */
const ColorHelpArgs = module.exports.ColorHelpArgs = text => text.replaceAll('[', c.red.bold('[')).replaceAll(']', c.red.bold(']'));

/**
 * RedSlashes - Colorize Slashes
 * @param {string} text Unformatted String
 * @returns {string} Formatted String
 */
const RedSlashes = module.exports.RedSlashes = text => text.replaceAll('/', c.red.bold('/'));

/**
 * TitleLine - Format a Title Line
 * @param {string} text Unformatted String
 * @returns {string} Formatted String
 */
const TitleLine = module.exports.TitleLine = text => c.white.bold.bgblack(text)

/**
 * Plural - Basic Pluralization
 * @param {string} text Text to apply Transform
 * @param {number} number Amount
 * @returns {type} Formatted String
 */
const Plural = module.exports.Plural = (text, number) => number > 1 || number === 0 ? text + 's' : text;

/**
 * StripNewLine - Strip New Lines
 * @param {type} text Unformatted Text
 * @returns {type} Formatted Text
 */
const StripNewLine = module.exports.StripNewLine = text => text.replace(/\r?\n|\r/g, ' ');

/**
 * Rot13 - 13 Letter shift encoder/decoer
 * @param {string} text Unformatted Text
 * @returns {string} Formatted Text
 */
const Rot13 = module.exports.Rot13 = text => text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));

/** Valid Hosts Expression **/
const ValidHostExpression = module.exports.ValidHostExpression = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;

/** Match Non printable characters */
const RemoveNonPrintChars = module.exports.RemoveNonPrintChars = /[\u0002\u001F\u0016\u0003\u000F]/g;

/** Match Fake Space characters */
const FakeSpaceChars = module.exports.FakeSpaceChars = /[\u0009\u000A\u000B\u000C\u000D\u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2029\u202F\u205F\u3000\u180E\u200B\u200C\u200D\u2060\uFEFF]/g;
