'use strict';
const Models = require('bookshelf-model-loader');

const RssChannelSubscription = Models.Base.extend({
    tableName: 'rssChannelSubscriptions',
    hasTimestamps: ['timestamp'],
    soft: false,
    feed: function () {
        return this.belongsTo(Models.RssFeed, 'feed_id', 'id');
    }
});

module.exports = {
    RssChannelSubscription: Models.Bookshelf.model('rssChannelSubscriptions', RssChannelSubscription)
};
