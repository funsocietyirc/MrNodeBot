'use strict';
// Logging Model
module.exports.model = app => app.Database.Model.extend({
    tableName: 'topics',
    hasTimestamps: ['timestamp']
});

// Name model
module.exports.modelName = 'topics';
