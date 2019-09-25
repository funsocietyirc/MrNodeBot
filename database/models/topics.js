const Models = require("funsociety-bookshelf-model-loader");

const Topics = Models.Base.extend({
    tableName: "topics",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false
});

module.exports = {
    Topics: Models.Bookshelf.model("topics", Topics)
};
