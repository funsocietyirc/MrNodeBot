'use strict';
var Models = require('bookshelf-model-loader');

var Mentioned = Models.Base.extend({
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
