'use strict';
var Models = require('bookshelf-model-loader');

var NoticeLogging = Models.Base.extend({
    tableName: 'noticeLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    NoticeLogging: Models.Bookshelf.model('noticeLogging', NoticeLogging)
};
