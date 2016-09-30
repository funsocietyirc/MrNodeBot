exports.up = function(knex, Promise) {
    return knex.schema.table('url', function(table) {
      table.string('title', 1000).nullable().defaultTo(null);
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('url', function(table) {
    table.dropColumn('title');
  });
};
