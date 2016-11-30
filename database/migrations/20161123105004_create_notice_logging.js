exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('noticeLogging', function(table) {
        table.increments('id').primary();
        table.string('from').collate('utf8_unicode_ci');
        table.string('to').collate('utf8_unicode_ci');
        table.string('text').collate('utf8_unicode_ci');
        table.string('user').collate('utf8_unicode_ci');
        table.string('host').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('noticeLogging');
};
