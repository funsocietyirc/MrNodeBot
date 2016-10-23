'use strict';
var Models = require('bookshelf-model-loader');

var KickLogging = Models.Base.extend({
    tableName: 'kickLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    KickLogging: Models.Bookshelf.model('kickLogging', KickLogging)
};
