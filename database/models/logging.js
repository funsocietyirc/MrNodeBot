'use strict';
const Models = require('bookshelf-model-loader');

const Logging = Models.Base.extend({
    tableName: 'logging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Logging: Models.Bookshelf.model('logging', Logging)
};
