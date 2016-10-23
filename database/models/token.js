'use strict';
var Models = require('bookshelf-model-loader');

var Token = Models.Base.extend({
    tableName: 'token',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Token: Models.Bookshelf.model('token', Token)
};