'use strict';
const Models = require('funsociety-bookshelf-model-loader');

const FlipStats = Models.Base.extend({
    tableName: 'flipStats',
    hasTimestamps: ['timestamp', 'updatedAt'],
    soft: false,
});

module.exports = {
    FlipStats: Models.Bookshelf.model('flipStats', FlipStats)
};
