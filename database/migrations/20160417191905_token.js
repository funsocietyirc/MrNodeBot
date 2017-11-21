exports.up = function (knex, Promise) {
    return knex.schema.createTable('token', (table) => {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('user').collate('utf8mb4_unicode_ci');
        table.string('channel').collate('utf8mb4_unicode_ci');
        table.string('token').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists('token');
};
