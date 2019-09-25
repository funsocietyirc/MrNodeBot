const Models = require("funsociety-bookshelf-model-loader");

const RouletteStats = Models.Base.extend({
    tableName: "rouletteStats",
    hasTimestamps: ["timestamp", "updatedAt"],
    soft: false,
    requireFetch: false
});

module.exports = {
    RouletteStats: Models.Bookshelf.model("rouletteStats", RouletteStats)
};
