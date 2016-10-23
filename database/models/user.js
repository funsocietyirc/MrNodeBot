'use strict';
var Models = require('bookshelf-model-loader');

var Users = Models.Base.extend({
    tableName: 'users',
    hasTimestamps: ['timestamp'],
    soft: false,
    hidden: ['password']
});

module.exports = {
    Users: Models.Bookshelf.model('users', Users)
};
