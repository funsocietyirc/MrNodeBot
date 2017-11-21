

exports.up = function (knex, Promise) {
    return knex.schema.table('greeter', (table) => {
        table.string('host', 1000).nullable().defaultTo(null).collate('utf8mb4_unicode_ci');
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('greeter', (table) => {
        table.dropColumn('host');
    });
};
