'use strict';
const Models = require('bookshelf-model-loader');

const Alias = Models.Base.extend({
  tableName: 'alias',
  hasTimestamps: ['timestamp'],
  soft: false
});

module.exports = {
  Alias: Models.Bookshelf.model('alias', Alias)
};
