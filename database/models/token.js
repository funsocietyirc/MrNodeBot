'use strict';
const Models = require('bookshelf-model-loader');

const Token = Models.Base.extend({
  tableName: 'token',
  hasTimestamps: ['timestamp'],
  soft: false
});

module.exports = {
  Token: Models.Bookshelf.model('token', Token)
};
