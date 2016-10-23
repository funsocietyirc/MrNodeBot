'use strict';
var Models = require('bookshelf-model-loader');

var Greeter = Models.Base.extend({
    tableName: 'greeter',
    hasTimestamps: ['timestamp'],
    soft: false
});

module.exports = {
    Greeter: Models.Bookshelf.model('greeter', Greeter)
};