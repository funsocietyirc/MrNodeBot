exports.up = function(knex, Promise) {
    return knex.schema.createTable('topics', function(table) {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('channel').collate('utf8mb4_unicode_ci');
        table.string('nick').collate('utf8mb4_unicode_ci');
        table.string('topic').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('topics');
};
