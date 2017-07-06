'use strict';

const tableName = 'rssChannelSubscriptions';

exports.up = function (knex, Promise) {
    return knex.schema.createTable(tableName, function (table) {
        // Table
        table.collate('utf8mb4_unicode_ci');

        // Meta
        table.increments('id').primary();
        table.string('creator').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());

        // Information
        table.string('channel').collate('utf8mb4_unicode_ci');
        table.integer('feed_id').references('rssFeeds_id');
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists(tableName);
};
