exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('greeter', function(table) {
        table.increments('id').primary();
        table.string('nick').collate('utf8_unicode_ci');
        table.string('channel').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('greeter');
};
