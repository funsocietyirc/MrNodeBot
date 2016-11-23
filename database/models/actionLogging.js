'use strict';
var Models = require('bookshelf-model-loader');

var ActionLogging = Models.Base.extend({
    tableName: 'actionLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    ActionLogging: Models.Bookshelf.model('actionLogging', ActionLogging)
};
