'use strict';

exports.up = function (knex, Promise) {
    return knex.schema.table('mention', function (table) {
        table.string('user').collate('utf8mb4_unicode_ci');
        table.string('host').collate('utf8mb4_unicode_ci');
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('mention', function (table) {
        table.dropColumns('user', 'host');
    });
};
