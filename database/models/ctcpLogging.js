'use strict';
const Models = require('bookshelf-model-loader');

const CtcpLogging = Models.Base.extend({
    tableName: 'ctcpLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    CtcpLogging: Models.Bookshelf.model('ctcpLogging', CtcpLogging)
};
