const Models = require("funsociety-bookshelf-model-loader");

const RssChannelSubscription = Models.Base.extend({
    tableName: "rssChannelSubscriptions",
    hasTimestamps: ["timestamp"],
    soft: false,
    feed() {
        return this.belongsTo(Models.RssFeed, "feed_id", "id");
    },
    requireFetch: false
});

module.exports = {
    RssChannelSubscription: Models.Bookshelf.model(
        "rssChannelSubscriptions",
        RssChannelSubscription
    )
};
