const Models = require("funsociety-bookshelf-model-loader");

const NoticeLogging = Models.Base.extend({
    tableName: "noticeLogging",
    hasTimestamps: ["timestamp"],
    soft: false,
    requireFetch: false
});

module.exports = {
    NoticeLogging: Models.Bookshelf.model("noticeLogging", NoticeLogging)
};
