// This configuration file is used primary by the knex cli tool
var config = require('./config');
module.exports = {
    development: {
        client: config.dbEngine,
        connection: {
            host     : config.dbHost,
            user     : config.dbUser,
            password : config.dbPass,
            database : config.dbSchema,
            charset  : 'utf8'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};
