const Models = require('funsociety-bookshelf-model-loader');

const Upvote = Models.Base.extend({
    tableName: 'upvotes',
    hasTimestamps: ['timestamp'],
    soft: false,
});

module.exports = {
    Upvote: Models.Bookshelf.model('upvotes', Upvote),
};
