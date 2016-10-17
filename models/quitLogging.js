'use strict';
var Models = require('bookshelf-model-loader');

var QuitLogging = Models.Base.extend({
    tableName: 'quitLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    QuitLogging: Models.Bookshelf.model('quitLogging', QuitLogging)
};
