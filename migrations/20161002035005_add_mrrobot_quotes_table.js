exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('mrrobotQuotes', function(table) {
        table.increments('id').primary();
        table.string('quote', 1000).nullable().defaultTo(null);
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('mrrobotQuotes');
};
