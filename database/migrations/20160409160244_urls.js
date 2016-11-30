exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('url', function(table) {
        table.increments('id').primary();
        table.string('url').collate('utf8_unicode_ci');
        table.string('to').collate('utf8_unicode_ci');
        table.string('from').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('url');
};
