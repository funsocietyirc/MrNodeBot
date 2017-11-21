exports.up = function (knex, Promise) {
    return knex.schema.createTable('alias', (table) => {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('oldnick').collate('utf8mb4_unicode_ci');
        table.string('newnick').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists('alias');
};
