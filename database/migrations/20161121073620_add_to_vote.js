exports.up = function (knex, Promise) {
    return knex.schema.table('upvotes', (table) => {
        table.string('text').nullable().collate('utf8mb4_unicode_ci');
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('upvotes', (table) => {
        table.dropColumns('text');
    });
};
