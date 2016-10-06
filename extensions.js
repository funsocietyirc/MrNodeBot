'use strict';

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
            return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'), (ignore ? 'gi' : 'g')), (typeof(str2) == "string") ? str2.replace(/\$/g, '$$$$') : str2);
        };
    }

}();
