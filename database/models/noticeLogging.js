'use strict';
const Models = require('bookshelf-model-loader');

const NoticeLogging = Models.Base.extend({
  tableName: 'noticeLogging',
  hasTimestamps: ['timestamp'],
  soft: false
});

module.exports = {
  NoticeLogging: Models.Bookshelf.model('noticeLogging', NoticeLogging)
};
