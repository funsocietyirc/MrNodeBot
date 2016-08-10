'use strict';
// Logging Model
module.exports.model = app => app.Database.Model.extend({
    tableName: 'greeter',
    hasTimestamps: ['timestamp']
});
// Name model
module.exports.modelName = 'greeter';
