exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('alias', function(table) {
        table.increments('id').primary();
        table.string('oldnick');
        table.string('newnick');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('alias');
};
