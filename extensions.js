'use strict';

const logger = require('./lib/logger');

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
        // String.prototype.replaceAll = function(str1, str2, ignore) {
        //     return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'), (ignore ? 'gi' : 'g')), (typeof(str2) == "string") ? str2.replace(/\$/g, '$$$$') : str2);
        // };
        String.prototype.replaceAll = function(search, replacement) {
            var target = this;
            // No valid input, return string, log
            if(!target) {
              logger.error(t('libraries:invalidReplaceInput'), {data: this});
              return '';
            }
            return target.replace(new RegExp(search, 'g'), replacement);
        };
    }
}();
