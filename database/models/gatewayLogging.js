
const Models = require('funsociety-bookshelf-model-loader');

const GatewayLogging = Models.Base.extend({
    tableName: 'gatewayLogging',
    hasTimestamps: ['timestamp'],
    soft: false,
});

module.exports = {
    GatewayLogging: Models.Bookshelf.model('gatewayLogging', GatewayLogging),
};
