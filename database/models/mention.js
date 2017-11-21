const Models = require('funsociety-bookshelf-model-loader');

const Mention = Models.Base.extend({
    tableName: 'mention',
    hasTimestamps: ['timestamp'],
    soft: false,
    mentioned() {
        return this.hasMany(Models.Mentioned);
    },
});

module.exports = {
    Mention: Models.Bookshelf.model('mention', Mention),
};
