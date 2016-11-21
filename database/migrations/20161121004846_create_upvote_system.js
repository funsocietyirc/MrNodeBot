
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('upvotes', function(table) {
      table.increments('id').primary();
      table.string('candidate');
      table.string('voter');
      table.string('channel');
      table.integer('result');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('upvotes');
};
