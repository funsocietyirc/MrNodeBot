
'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.table('users', function(table) {
        table.boolean('admin').default(false);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('users', function(table) {
        table.dropColumn('admin');
    });
};
