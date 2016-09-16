
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('encrypt', function(table) {
      table.increments('id').primary();
      table.string('to',25).notNullable();
      table.string('from',25).notNullable();
      table.string('password').notNullable();
      table.string('message',6147).notNullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};
exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('encrypt');
};
