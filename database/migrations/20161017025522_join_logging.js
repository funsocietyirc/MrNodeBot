exports.up = function (knex, Promise) {
    return knex.schema.createTable('joinLogging', (table) => {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('channel').collate('utf8mb4_unicode_ci');
        table.string('nick').collate('utf8mb4_unicode_ci');
        table.string('user').collate('utf8mb4_unicode_ci');
        table.string('host').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists('joinLogging');
};
