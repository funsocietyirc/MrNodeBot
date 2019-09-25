const Models = require("funsociety-bookshelf-model-loader");

const Mentioned = Models.Base.extend({
    tableName: "mentioned",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false,
    mention() {
        return this.belongsTo(Models.Mention);
    }
});

module.exports = {
    Mentioned: Models.Bookshelf.model("mentioned", Mentioned)
};
