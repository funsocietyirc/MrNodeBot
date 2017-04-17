'use strict';
const Models = require('bookshelf-model-loader');

const Mentioned = Models.Base.extend({
  tableName: 'mentioned',
  hasTimestamps: ['timestamp'],
  soft: false,
  mention: function() {
    return this.belongsTo(Models.Mention);
  }
});

module.exports = {
  Mentioned: Models.Bookshelf.model('mentioned', Mentioned)
};
