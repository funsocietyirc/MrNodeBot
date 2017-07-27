'use strict';
const Models = require('funsociety-bookshelf-model-loader');

const MrRobotQuotes = Models.Base.extend({
    tableName: 'mrrobotQuotes',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    MrRobotQuotes: Models.Bookshelf.model('MrRobotQuotes', MrRobotQuotes)
};
