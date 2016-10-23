'use strict';
var Models = require('bookshelf-model-loader');

var JoinLogging = Models.Base.extend({
    tableName: 'joinLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    JoinLogging: Models.Bookshelf.model('joinLogging', JoinLogging)
};
