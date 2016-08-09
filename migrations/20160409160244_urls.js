exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('url', function(table) {
        table.increments('id').primary();
        table.string('url');
        table.string('to');
        table.string('from');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('url');
};
