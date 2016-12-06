'use strict';
// Pattern to base extract on
const pattern = /^(.*)(?:\^(.*))@.*$/img;
const _ = require('lodash');

module.exports = text => {
    // Invalid args
    if (_.isUndefined(text) || !_.isString(text) || _.isEmpty(text)) return Object.create(null);
    let matches = text.match(pattern);
    // No matches available, return empty object
    if (!matches) return Object.create(null);
    // Matches available, return results
    return _.compact({
        fullMatch: matches[0],
        nick: matches[1],
        ident: matches[2],
        host: matches[3]
    });
};
