
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('users', function(table) {
      table.increments('id').primary();
      table.string('nick',25).notNullable().unique();
      table.string('password').notNullable();
      table.string('email').notNullable();
      table.string('host').nullable();
      table.boolean('verified').default(false).notNullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
