'use strict';
var Models = require('bookshelf-model-loader');

var Mention = Models.Base.extend({
    tableName: 'mention',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Mention: Models.Bookshelf.model('mention', Mention)
};
