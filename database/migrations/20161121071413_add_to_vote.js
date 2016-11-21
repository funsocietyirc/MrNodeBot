exports.up = function(knex, Promise) {
    return knex.schema.table('upvotes', function(table) {
        table.string('user');
        table.string('host');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('upvotes', function(table) {
        table.dropColumns('user','host');
    });
};
