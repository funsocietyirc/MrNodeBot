'use strict';
'use strict';
var Models = require('bookshelf-model-loader');

var Topics = Models.Base.extend({
    tableName: 'topics',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Topics: Models.Bookshelf.model('topics', Topics)
};