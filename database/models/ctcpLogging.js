'use strict';
var Models = require('bookshelf-model-loader');

var CtcpLogging = Models.Base.extend({
    tableName: 'ctcpLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    CtcpLogging: Models.Bookshelf.model('ctcpLogging', CtcpLogging)
};
