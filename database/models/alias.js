'use strict';
var Models = require('bookshelf-model-loader');

var Alias = Models.Base.extend({
    tableName: 'alias',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Alias: Models.Bookshelf.model('alias', Alias)
};