'use strict';
const Models = require('funsociety-bookshelf-model-loader');

const RouletteStats = Models.Base.extend({
    tableName: 'rouletteStats',
    hasTimestamps: ['timestamp', 'updatedAt'],
    soft: false,
});

module.exports = {
    RouletteStats: Models.Bookshelf.model('rouletteStats', RouletteStats)
};
