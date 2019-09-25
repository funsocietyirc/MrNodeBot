const Models = require("funsociety-bookshelf-model-loader");

const CtcpLogging = Models.Base.extend({
    tableName: "ctcpLogging",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false
});

module.exports = {
    CtcpLogging: Models.Bookshelf.model("ctcpLogging", CtcpLogging)
};
