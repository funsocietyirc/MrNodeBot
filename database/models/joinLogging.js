'use strict';
const Models = require('bookshelf-model-loader');

const JoinLogging = Models.Base.extend({
  tableName: 'joinLogging',
  hasTimestamps: ['timestamp'],
  soft: false
});

module.exports = {
  JoinLogging: Models.Bookshelf.model('joinLogging', JoinLogging)
};
