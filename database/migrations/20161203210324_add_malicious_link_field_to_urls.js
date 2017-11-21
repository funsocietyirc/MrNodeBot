exports.up = function (knex, Promise) {
    return knex.schema.table('url', (table) => {
        table.boolean('threat').nullable();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table('url', (table) => {
        table.dropColumn('threat');
    });
};
