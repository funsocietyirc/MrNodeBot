'use strict';

const logger = require('./lib/logger');
const _ = require('lodash');

// Primitive Prototype Shims
exports = function() {
    /**
     * Check if the string starts with
     */
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }
    // Replace all instances of a string with another string
    // Third optional argument for ignore
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(str1, str2, ignore) {
            let target = _.isString(this) ? this : '';
            str1 = _.isString(str1) ? str1 : '';
            str2 = _.isString(str2) ? str2 : '';
            return target.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'), (ignore ? 'gi' : 'g')), str2.replace(/\$/g, '$$$$'));
        };
    }
}();
