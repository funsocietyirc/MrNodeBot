exports.up = function (knex, Promise) {
    return knex.schema.table('users', (table) => {
        table.boolean('admin').default(false);
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('admin');
    });
};
