exports.up = function(knex, Promise) {
    return knex.schema.createTable('mrrobotQuotes', function(table) {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('quote', 1000).nullable().defaultTo(null).collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('mrrobotQuotes');
};
