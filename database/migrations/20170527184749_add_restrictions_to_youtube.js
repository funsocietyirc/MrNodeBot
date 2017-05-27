'use strict';

const tableName = 'youTubeLink';

exports.up = function (knex, Promise) {
    return knex.schema.table(tableName, function (table) {
        table.boolean('restrictions').nullable();
        table.boolean('embeddable').nullable();

    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table(tableName, function (table) {
        table.dropColumns('restrictions', 'embeddable');
    });
};
