'use strict';
// Logging Model
module.exports.model = app => app.Database.Model.extend({
    tableName: 'alias',
    hasTimestamps: ['timestamp']
});

// Name model
module.exports.modelName = 'alias';
