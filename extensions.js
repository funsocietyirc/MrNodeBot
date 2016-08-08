'use strict';

// Primitive Prototype Shims
exports = function() {
    /**
     * Add C# like string.format function to javascript
     * "{0} hello".format('Well');
     * Deprecated, please use es6 template strings
     */
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        };
    }

    /**
     * Remove the first word from the string
     */
    if (!String.prototype.stripFirst) {
        String.prototype.stripFirst = function() {
            return this.substr(this.indexOf(' ') + 1);
        };
    }

    /**
     * Check for empty string
     */
    if (!String.prototype.isEmpty) {
        String.prototype.isEmpty = function() {
            return this.length === 0;
        };
    }

    /**
     * Get the first word in a string
     */
    if (!String.prototype.getFirst) {
        String.prototype.getFirst = function() {
            return this.split(' ')[0];
        };
    }

    /**
     * Check if the string starts with
     */
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }

    /**
     * Add a contains to the String primitive
     * @param it
     * @returns {boolean}
     */
    if (!String.prototype.contains) {
        String.prototype.contains = function(it) {
            return this.indexOf(it) !== -1;
        };
    }

    /**
     * A simple add an as
     * @param number
     * @returns {string}
     */
    if (!String.prototype.plural) {
        String.prototype.plural = function(number) {
            return number > 1 || number === 0 ? this + 's' : this;
        };

    }

    /**
     * Capitalize the first letter
     * @returns {string}
     */
    if (!String.prototype.capFirst) {
        String.prototype.capFirst = function() {
            return this.charAt(0).toUpperCase() + this.slice(1);
        };
    }

    // Replace all instances of a string with another string
    // Third optional argument for ignore
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(str1, str2, ignore) {
            return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'), (ignore ? 'gi' : 'g')), (typeof(str2) == "string") ? str2.replace(/\$/g, '$$$$') : str2);
        };
    }

    /**
     * Array index of polyfill
     * @param needle
     * @returns {number}
     */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(needle) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === needle) {
                    return i;
                }
            }
            return -1;
        };
    }

    if (!Array.prototype.contains) {
        Array.prototype.contains = function(needle) {
            return this.indexOf(needle) !== -1;
        };
    }
}();
