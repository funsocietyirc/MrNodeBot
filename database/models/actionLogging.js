'use strict';
const Models = require('bookshelf-model-loader');

const ActionLogging = Models.Base.extend({
    tableName: 'actionLogging',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    ActionLogging: Models.Bookshelf.model('actionLogging', ActionLogging)
};
