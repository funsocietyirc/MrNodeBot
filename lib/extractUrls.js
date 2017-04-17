'use strict';
// This is a wrapper around URI.js with some custom edge case filtering
const uri = require('urijs');

// Extract URLS
module.exports = text => {
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
  return urls;
};
