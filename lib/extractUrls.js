'use strict';
// This is a wrapper around URI.js with some custom edge case filtering
const _ = require('lodash');
const uri = require('urijs');

// Extract URLS
module.exports = (text, limit = 0) => {
    let urls = [];
    uri.withinString(text, rawUrl => {
        // Grab a url from upstream
        let url = uri(rawUrl).toString();
        // Exclusions
        if (
            // Remove empty matches, http(s)://(/) or www(.)
            !url.match(/^(?:http[s]?:\/{1,3}|www[.]?)$/im)
        )
        // Push result
            urls.push(url);
    });

    return (Number.isInteger(limit) && limit > 0) ? _.take(urls, limit) : urls;
};
