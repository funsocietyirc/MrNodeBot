// Pattern to base extract on
// nick*user@host #channel
const pattern = /^\s*([^\s!@]+)?!?([^\s@]+)?@?(\S+)?.?(\S+)?.*$/im;
const _ = require('lodash');

module.exports = (text) => {
    // Invalid args
    if (!_.isString(text) || _.isEmpty(text)) return Object.create(null);
    const matches = text.match(pattern);

    // No matches available, return empty object
    if (!matches) return Object.create(null);

    // Format a text based representation
    let fullMatch = '';
    if (matches[1]) fullMatch = matches[1];
    if (matches[2]) fullMatch += `!${matches[2]}`;
    if (matches[3]) fullMatch += `@${matches[3]}`;
    if (matches[4]) fullMatch += ` ${matches[4]}`;

    return {
        fullMatch,
        nick: matches[1],
        user: matches[2],
        host: matches[3],
        channel: matches[4],
    };
};
