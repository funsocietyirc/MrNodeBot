exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('joinLogging', function(table) {
        table.increments('id').primary();
        table.string('channel').collate('utf8_unicode_ci');
        table.string('nick').collate('utf8_unicode_ci');
        table.string('user').collate('utf8_unicode_ci');
        table.string('host').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('joinLogging');
};
