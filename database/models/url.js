'use strict';
const Models = require('bookshelf-model-loader');

const Url = Models.Base.extend({
  tableName: 'url',
  hasTimestamps: ['timestamp'],
  soft: false
});

module.exports = {
  Url: Models.Bookshelf.model('url', Url)
};
