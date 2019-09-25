const Models = require("funsociety-bookshelf-model-loader");

const Quotes = Models.Base.extend({
    tableName: "quotes",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false
});

module.exports = {
    Quotes: Models.Bookshelf.model("Quotes", Quotes)
};
