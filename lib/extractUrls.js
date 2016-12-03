'use strict';
// This is a wrapper around URI.js with some custom edge case filtering
const uri = require('urijs');

// Extract URLS
module.exports = text => {
    let urls = [];
    uri.withinString(text, rawUrl => {
        // Grab a url from upstream
        let url = uri(rawUrl).toString();

        // TODO Hack to fix wikipedia links, upstream issue
        // https://github.com/medialize/URI.js/issues/247
        // This will append the leading ) on the end of a wiki url
        if (url.match(/wikipedia\.org\/wiki\/.*_\(/i) && !url.endsWith(')')) url = url + ')';

        // Exclusions
        if (
          // Remove empty matches, http(s)://(/) or www(.)
          !url.match(/^(?:http[s]?:\/{1,3}|www[.]?)$/im)
        )
        // Push result
        urls.push(url);
    });
    return urls;
};
