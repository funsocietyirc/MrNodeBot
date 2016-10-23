
exports.up = function(knex, Promise) {
  return knex.schema.table('greeter', function(table) {
    table.string('host', 1000).nullable().defaultTo(null);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('greeter', function(table) {
    table.dropColumn('host');
  });
};
