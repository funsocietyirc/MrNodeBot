exports.up = function (knex, Promise) {
    return knex.schema.createTable('quitLogging', (table) => {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('nick').collate('utf8mb4_unicode_ci');
        table.string('reason', 1000).collate('utf8mb4_unicode_ci');
        table.string('channels', 1000).collate('utf8mb4_unicode_ci');
        table.string('user').collate('utf8mb4_unicode_ci');
        table.string('host').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists('quitLogging');
};
