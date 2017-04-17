'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('url', function(table) {
    table.string('title', 1000).nullable().defaultTo(null).collate('utf8mb4_unicode_ci');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('url', function(table) {
    table.dropColumn('title');
  });
};
