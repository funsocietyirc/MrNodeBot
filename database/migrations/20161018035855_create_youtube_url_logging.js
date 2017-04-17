'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('youTubeLink', function(table) {
    table.collate('utf8mb4_unicode_ci');
    table.increments('id').primary();
    table.string('to').collate('utf8mb4_unicode_ci');
    table.string('from').collate('utf8mb4_unicode_ci');
    table.string('title', 1000).collate('utf8mb4_unicode_ci');
    table.string('url').collate('utf8mb4_unicode_ci');
    table.string('user').collate('utf8mb4_unicode_ci');
    table.string('host').collate('utf8mb4_unicode_ci');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('youTubeLink');
};
