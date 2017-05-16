'use strict';

exports.up = function (knex, Promise) {
    return knex.schema.table('url', function (table) {
        table.boolean('threat').nullable();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('url', function (table) {
        table.dropColumn('threat');
    });
};
