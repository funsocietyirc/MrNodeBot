
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('users', function(table) {
      table.increments('id').primary();
      table.string('nick',25).notNullable().unique().collate('utf8_unicode_ci');
      table.string('password').notNullable().collate('utf8_unicode_ci');
      table.string('email').notNullable().collate('utf8_unicode_ci');
      table.string('host').nullable().collate('utf8_unicode_ci');
      table.boolean('verified').default(false).notNullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
