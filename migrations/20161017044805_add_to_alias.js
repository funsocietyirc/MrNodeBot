exports.up = function(knex, Promise) {
    return knex.schema.table('alias', function(table) {
        table.string('channels', 1000);
        table.string('user');
        table.string('host');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('alias', function(table) {
        table.string('channels', 1000);
        table.string('user');
        table.string('host');
    });
};
