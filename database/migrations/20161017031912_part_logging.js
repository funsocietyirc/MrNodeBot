exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('partLogging', function(table) {
        table.increments('id').primary();
        table.string('channel');
        table.string('nick');
        table.string('reason',1000);
        table.string('user');
        table.string('host');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('partLogging');
};
