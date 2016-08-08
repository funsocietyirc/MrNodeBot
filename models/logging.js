'use strict';
// Logging Model
module.exports.model = app => app.Database.Model.extend({
    tableName: 'logging',
    hasTimestamps: ['timestamp']
});

// Name model
module.exports.modelName = 'logging';
