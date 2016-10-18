exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('youTubeLink', function(table) {
        table.increments('id').primary();
        table.string('to');
        table.string('from');
        table.string('title',1000);
        table.string('url');
        table.string('user');
        table.string('host');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('youTubeLink');
};
