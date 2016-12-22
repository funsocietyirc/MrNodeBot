'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.createTable('ctcpLogging', function(table) {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('from').collate('utf8mb4_unicode_ci');
        table.string('to').collate('utf8mb4_unicode_ci');
        table.string('text').collate('utf8mb4_unicode_ci');
        table.string('type').collate('utf8mb4_unicode_ci');
        table.string('user').collate('utf8mb4_unicode_ci');
        table.string('host').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('ctcpLogging');
};
