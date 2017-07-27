'use strict';
const Models = require('funsociety-bookshelf-model-loader');

const RssFeed = Models.Base.extend({
    tableName: 'rssFeeds',
    hasTimestamps: ['timestamp'],
    soft: false,
    subscriptions: function() {
        return this.hasMany(Models.RssChannelSubscription, 'feed_id');
    }
});

module.exports = {
    RssFeed: Models.Bookshelf.model('rssFeeds', RssFeed)
};
