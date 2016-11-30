
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('upvotes', function(table) {
      table.increments('id').primary();
      table.string('candidate').collate('utf8_unicode_ci');
      table.string('voter').collate('utf8_unicode_ci');
      table.string('channel').collate('utf8_unicode_ci');
      table.integer('result').collate('utf8_unicode_ci');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('upvotes');
};
