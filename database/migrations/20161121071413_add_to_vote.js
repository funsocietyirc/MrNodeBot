exports.up = function(knex, Promise) {
    return knex.schema.table('upvotes', function(table) {
        table.string('user').collate('utf8_unicode_ci');
        table.string('host').collate('utf8_unicode_ci');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('upvotes', function(table) {
        table.dropColumns('user','host');
    });
};
