exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('alias', function(table) {
        table.increments('id').primary();
        table.string('oldnick').collate('utf8_unicode_ci');
        table.string('newnick').collate('utf8_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('alias');
};
