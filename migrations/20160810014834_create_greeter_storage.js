exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('greeter', function(table) {
        table.increments('id').primary();
        table.string('nick');
        table.string('channel');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('greeter');
};
