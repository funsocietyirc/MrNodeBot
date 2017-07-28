'use strict';

const tableName = 'flipStats';

exports.up = function (knex, Promise) {
    return knex.schema.createTable(tableName, function (table) {
        // Table
        table.collate('utf8mb4_unicode_ci');

        // Meta
        table.increments('id').primary();
        table.string('from', 100).unique().collate('utf8mb4_unicode_ci');
        table.integer('wins').defaultTo(0);
        table.integer('losses').defaultTo(0);
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').nullable();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists(tableName);
};
