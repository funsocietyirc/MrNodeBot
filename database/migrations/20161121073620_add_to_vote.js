exports.up = function(knex, Promise) {
    return knex.schema.table('upvotes', function(table) {
        table.string('text').nullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('upvotes', function(table) {
        table.dropColumns('text');
    });
};
