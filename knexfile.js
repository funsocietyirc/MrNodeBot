// This configuration file is used primary by the knex cli tool
var config = require('./config');
// Switch between engines
const knexConfig = config.knex.engine === 'sqlite' ? config.knex.sqlite : config.knex.mysql;

module.exports = {
    development: {
        client: knexConfig.client,
        connection: knexConfig.connection,
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};
