'use strict';
const uri = require('urijs');

// Extract URLS
module.exports = text =>{
  let urls = [];
  uri.withinString(text, url => urls.push(uri(url).toString()));
  return urls;
};
