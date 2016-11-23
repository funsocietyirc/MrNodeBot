exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('actionLogging', function(table) {
        table.increments('id').primary();
        table.string('from');
        table.string('to');
        table.string('text');
        table.string('user');
        table.string('host');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('actionLogging');
};
