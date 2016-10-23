exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('topics', function(table) {
        table.increments('id').primary();
        table.string('channel');
        table.string('nick');
        table.string('topic');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('topics');
};
