const Models = require('funsociety-bookshelf-model-loader');

const Greeter = Models.Base.extend({
    tableName: 'greeter',
    hasTimestamps: ['timestamp'],
    soft: false,
});

module.exports = {
    Greeter: Models.Bookshelf.model('greeter', Greeter),
};
