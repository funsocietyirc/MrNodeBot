exports.up = function (knex, Promise) {
    return knex.schema.table('topics', (table) => {
        table.string('user').collate('utf8mb4_unicode_ci').default(null);
        table.string('host').collate('utf8mb4_unicode_ci').default(null);
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('topics', (table) => {
        table.dropColumns('user', 'host');
    });
};
