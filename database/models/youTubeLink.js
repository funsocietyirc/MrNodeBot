'use strict';
var Models = require('bookshelf-model-loader');

var YouTubeLink = Models.Base.extend({
    tableName: 'youTubeLink',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    YouTubeLink: Models.Bookshelf.model('youTubeLink', YouTubeLink)
};
