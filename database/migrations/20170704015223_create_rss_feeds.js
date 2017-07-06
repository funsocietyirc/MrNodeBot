'use strict';

const tableName = 'rssFeeds';

exports.up = function (knex, Promise) {
    return knex.schema.createTable(tableName, function (table) {
        // Table
        table.collate('utf8mb4_unicode_ci');

        // Meta
        table.increments('id').primary();
        table.string('creator').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());

        // Information
        table.string('name').collate('utf8mb4_unicode_ci');
        table.string('link', 191).collate('utf8mb4_unicode_ci').unique();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists(tableName);
};
