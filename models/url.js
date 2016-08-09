'use strict';
// Logging Model
module.exports.model = app => app.Database.Model.extend({
    tableName: 'url',
    hasTimestamps: ['timestamp']
});

// Name model
module.exports.modelName = 'url';
