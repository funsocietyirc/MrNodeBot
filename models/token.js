'use strict';
// Logging Model
module.exports.model = app => app.Database.Model.extend({
    tableName: 'token',
    hasTimestamps: ['timestamp']
});

// Name model
module.exports.modelName = 'token';
