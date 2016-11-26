exports.up = function(knex, Promise) {
    return knex.schema.createTable('mention', function(table) {
        table.increments('id').primary();
        table.string('text', 550);
        table.string('by');
        table.string('channel');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    }).createTable('mentioned', function(table) {
        table.increments('id').primary();
        table.string('nick');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.integer('mention_id').references('mention_id');
    });
};
exports.down = function(knex, Promise) {
    return knex.schema.dropTable('mention')
        .dropTable('mentioned');
};
