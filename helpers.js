/* eslint-disable no-useless-escape */
/* eslint-disable no-return-assign */
/* eslint-disable no-misleading-character-class */
/* eslint-disable no-control-regex */

/**
 * @module Helpers
 * @author Dave Richer
 */

const moment = require('moment');
const accounting = require('accounting-js');
const c = require('irc-colors');
const _ = require('lodash');

/**
 * Format a number (using separators)
 * @param input
 */
const formatNumber = (input) => accounting.formatNumber(input, {
    precision: 0,
});
module.exports.formatNumber = formatNumber;

/**
 * Check to see if a function is async or not
 * @param func
 * @return {boolean}
 */
const isAsync = (func) => func.toString().toLowerCase().startsWith('async');
module.exports.isAsync = isAsync;

/**
 * AccessString - Get A String representation of a Access Level
 * @param {String} str Number value of the access string
 * @returns {String} A String representation of the access value
 */
const AccessString = (str) => {
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

module.exports.AccessString = AccessString;

/**
 * Search a iterable for a value and return the first key
 * @param {Map} map The Iterable
 * @param {Object} value The value to search for
 * @returns {Boolean} the first match found
 */
const MapSearch = (map, value) => {
    for (const [t, v] of map) {
        if (v === value) return t;
    }
    return false;
};

module.exports.MapSearch = MapSearch;

/** Start Time in moment format */
const StartTime = moment();

module.exports.StartTime = StartTime;

/* Color stuffs */

/**
 * ColorHelpArgs - Colorize brackets
 * @param {String} text Un-formatted String
 * @returns {String} Un-formatted String
 */
const ColorHelpArgs = (text) => text.replace(/([\[\],])/g, c.red.bold('$1'));

module.exports.ColorHelpArgs = ColorHelpArgs;

/**
 * RedSlashes - Colorize Slashes
 * @param {String} text Un-formatted String
 * @returns {String} Formatted String
 */
const RedSlashes = (text) => text.replace(/(\/)/g, c.red.bold('$1'));
module.exports.RedSlashes = RedSlashes;

/**
 * TitleLine - Format a Title Line
 * @param {String} text Un-formatted String
 * @returns {String} Formatted String
 */
const TitleLine = (text) => c.white.bold.bgblack(text);
module.exports.TitleLine = TitleLine;

/**
 * Plural - Basic Pluralization
 * @param {String} text Text to apply Transform
 * @param {Number} number Amount
 * @returns {String} Formatted String
 */
const Plural = (text, number) => (number > 1 || number === 0 ? `${text}s` : text);
module.exports.Plural = Plural;

/**
 * StripNewLine - Strip New Lines
 * @param {String} text Un-formatted Text
 * @returns {String} Formatted Text
 */
const StripNewLine = (text) => text.replace(/\r?\n|\r/g, ' ');
module.exports.StripNewLine = StripNewLine;

/**
 * Replace all occurrences of needle in haystack with replacement
 * @param {String} haystack the text to search in
 * @param {String} needle what we are looking for
 * @param {String} replacement what to replace the needle with
 * @returns {String} haystack with needles replaced by replacement
 */
const ReplaceAll = (haystack, needle, replacement) => {
    if (!_.isString(haystack) || !_.isString(needle) || !_.isString(replacement)) return haystack;
    // eslint-disable-next-line no-useless-escape
    return haystack.replace(new RegExp(needle.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'), 'g'), replacement.replace(/\$/g, '$$$$'));
};

module.exports.ReplaceAll = ReplaceAll;

/**
 * Rot13 - 13 Letter shift encoder/decoder
 * @param {String} text Un-formatted Text
 * @returns {String} Formatted Text
 */
const Rot13 = (text) => text.replace(/[a-zA-Z]/g, (c) => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));

module.exports.Rot13 = Rot13;

/** Valid Hosts Expression * */
const ValidHostExpression = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;

module.exports.ValidHostExpression = ValidHostExpression;

/** Match Non printable characters */
const RemoveNonPrintChars = /[\u0002\u001F\u0016\u0003\u000F]/g;

module.exports.RemoveNonPrintChars = RemoveNonPrintChars;

/** Match Fake Space characters */
const FakeSpaceChars = /[\u0009\u000A\u000B\u000C\u000D\u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2029\u202F\u205F\u3000\u180E\u200B\u200C\u200D\u2060\uFEFF]/g;

module.exports.FakeSpaceChars = FakeSpaceChars;

/**
 * Youtube Expression
 * */
const YoutubeExpression = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

module.exports.YoutubeExpression = YoutubeExpression;

/**
 * Get Key From Object
 * @param obj
 * @param index
 * @returns {string}
 */
const getKeyFromObj = (obj, index) => Object.getOwnPropertyNames(obj).slice(index)[0];

module.exports.getKeyFromObj = getKeyFromObj;

/**
 * Get Value From Object
 * @param obj
 * @param index
 * @returns {*}
 */
const getValueFromObj = (obj, index) => obj[Object.keys(obj)[Object.keys(obj).length + index]];

module.exports.getValueFromObj = getValueFromObj;

/**
 * Chunk Objects
 * @type {function(*=, *=): *}
 */
const chunkObj = (input, size) => _.chain(input).toPairs().chunk(size).map(_.fromPairs)
    .value();

module.exports.chunkObj = chunkObj;

/**
 * Hash Pattern Replacement Regex
 * @type {RegExp}
 */
const hashPattern = new RegExp('%23', 'g');

module.exports.hashPattern = hashPattern;
