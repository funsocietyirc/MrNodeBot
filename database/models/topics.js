'use strict';
const Models = require('bookshelf-model-loader');

const Topics = Models.Base.extend({
    tableName: 'topics',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Topics: Models.Bookshelf.model('topics', Topics)
};
