const tableName = 'quotes';

exports.up = function (knex, Promise) {
    return knex.schema.createTable(tableName, (table) => {
        // Table
        table.collate('utf8mb4_unicode_ci');

        // Meta
        table.increments('id').primary();
        table.string('from', 100).collate('utf8mb4_unicode_ci');
        table.string('to', 100).collate('utf8mb4_unicode_ci');
        table.string('text', 2048).collate('utf8mb4_unicode_ci');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').nullable();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTableIfExists(tableName);
};
