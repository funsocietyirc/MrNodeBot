exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('logging', function(table) {
        table.increments('id').primary();
        table.string('to');
        table.string('from');
        table.string('text');
        table.string('host');
        table.string('ident');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('logging');
};
