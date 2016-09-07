'use strict';
var Models = require('bookshelf-model-loader');

var Logging = Models.Base.extend({
    tableName: 'logging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Logging: Models.Bookshelf.model('logging', Logging)
};