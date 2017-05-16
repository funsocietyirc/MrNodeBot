'use strict';

exports.up = function (knex, Promise) {
    return knex.schema.table('upvotes', function (table) {
        table.string('text').nullable().collate('utf8mb4_unicode_ci');
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('upvotes', function (table) {
        table.dropColumns('text');
    });
};
