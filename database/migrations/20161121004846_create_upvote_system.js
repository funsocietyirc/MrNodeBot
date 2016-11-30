exports.up = function(knex, Promise) {
    return knex.schema.createTable('upvotes', function(table) {
        table.collate('utf8mb4_unicode_ci');
        table.increments('id').primary();
        table.string('candidate').collate('utf8mb4_unicode_ci');
        table.string('voter').collate('utf8mb4_unicode_ci');
        table.string('channel').collate('utf8mb4_unicode_ci');
        table.integer('result').collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('upvotes');
};
