'use strict';
var Models = require('bookshelf-model-loader');

var Encrypt = Models.Base.extend({
    tableName: 'encrypt',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Encrypt: Models.Bookshelf.model('encrypt', Encrypt)
};
