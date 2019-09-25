const Models = require("funsociety-bookshelf-model-loader");

const Alias = Models.Base.extend({
    tableName: "alias",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false
});

module.exports = {
    Alias: Models.Bookshelf.model("alias", Alias)
};
