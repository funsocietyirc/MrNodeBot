const config = require('../config');

// Switch between engines
const knexConfig = config.knex.engine === 'sqlite' ? config.knex.sqlite : config.knex.mysql;
module.exports = require('bookshelf')(require('knex')({
    client: knexConfig.client,
    connection: knexConfig.connection,
    useNullAsDefault: knexConfig.client === 'sqlite3' ? true : false
}));
