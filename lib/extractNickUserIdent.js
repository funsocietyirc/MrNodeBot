'use strict';
// Pattern to base extract on
// nick*user@host #channel
const pattern = /^(?=[\S])([^\s!@]+)?!?([^\s@]+)?@?([\S]+)?.?([^\s]+)?$/im;
const _ = require('lodash');
module.exports = text => {
    // Invalid args
    if (!_.isString(text) || _.isEmpty(text)) return Object.create(null);
    let matches = text.trim().match(pattern);

    // No matches available, return empty object
    if (!matches) return Object.create(null);

    return {
        fullMatch: matches[0],
        nick: matches[1],
        user: matches[2],
        host: matches[3],
        channel: matches[4],
    };
};
