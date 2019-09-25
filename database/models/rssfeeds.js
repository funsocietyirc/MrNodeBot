const Models = require("funsociety-bookshelf-model-loader");

const RssFeed = Models.Base.extend({
    tableName: "rssFeeds",
    hasTimestamps: ["timestamp"],
    soft: false,
    subscriptions() {
        return this.hasMany(Models.RssChannelSubscription, "feed_id");
    },
    requireFetch: false
});

module.exports = {
    RssFeed: Models.Bookshelf.model("rssFeeds", RssFeed)
};
