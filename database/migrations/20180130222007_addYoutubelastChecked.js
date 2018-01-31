const tableName = 'youTubeLink';

exports.up = function (knex, Promise) {
    return knex.schema.table(tableName, (table) => {
        table.timestamp('lastChecked').nullable();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.table(tableName, (table) => {
        table.dropColumns('lastChecked');
    });
};
