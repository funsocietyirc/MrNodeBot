'use strict';
var Models = require('bookshelf-model-loader');

var PartLogging = Models.Base.extend({
    tableName: 'partLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    PartLogging: Models.Bookshelf.model('partLogging', PartLogging)
};
