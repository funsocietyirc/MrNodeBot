exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('token', function(table) {
        table.increments('id').primary();
        table.string('user').collate('utf8_unicode_ci');
        table.string('channel').collate('utf8_unicode_ci');
        table.string('token').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('token');
};
