const Models = require('funsociety-bookshelf-model-loader');

const Users = Models.Base.extend({
    tableName: 'users',
    hasTimestamps: ['timestamp'],
    soft: false,
    hidden: ['password'],
});

module.exports = {
    Users: Models.Bookshelf.model('users', Users),
};
