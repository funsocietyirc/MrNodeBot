'use strict';
var Models = require('bookshelf-model-loader');

var MrRobotQuotes = Models.Base.extend({
    tableName: 'mrrobotQuotes',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    MrRobotQuotes: Models.Bookshelf.model('MrRobotQuotes', MrRobotQuotes)
};
