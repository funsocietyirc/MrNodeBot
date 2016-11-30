exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('logging', function(table) {
        table.increments('id').primary();
        table.string('to').collate('utf8_unicode_ci');
        table.string('from').collate('utf8_unicode_ci');
        table.string('text').collate('utf8_unicode_ci');
        table.string('host').collate('utf8_unicode_ci');
        table.string('ident').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('logging');
};
