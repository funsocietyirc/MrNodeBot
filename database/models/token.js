'use strict';
const Models = require('funsociety-bookshelf-model-loader');

const Token = Models.Base.extend({
    tableName: 'token',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Token: Models.Bookshelf.model('token', Token)
};
