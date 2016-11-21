'use strict';
var Models = require('bookshelf-model-loader');

var Upvote = Models.Base.extend({
    tableName: 'upvotes',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Upvote: Models.Bookshelf.model('upvotes', Upvote)
};
