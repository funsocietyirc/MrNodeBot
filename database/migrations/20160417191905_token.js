exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('token', function(table) {
        table.increments('id').primary();
        table.string('user');
        table.string('channel');
        table.string('token');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('token');
};
