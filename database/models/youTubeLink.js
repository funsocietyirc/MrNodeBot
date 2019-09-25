const Models = require("funsociety-bookshelf-model-loader");

const YouTubeLink = Models.Base.extend({
    tableName: "youTubeLink",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false
});

module.exports = {
    YouTubeLink: Models.Bookshelf.model("youTubeLink", YouTubeLink)
};
