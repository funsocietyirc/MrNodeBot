const config = require('../newconfig');

// Switch between engines
let knexConfig = null;
switch(config.knex.engine) {
    case 'mysql':
        knexConfig = config.knex.mysql
        break;
    case 'sqlite':
        knexConfig = config.knex.sqlite;
        break;
    default:
        knexConfig = config.knex.sqlite;
};

// Create the ORM
module.exports = require('bookshelf')(require('knex')({
    client: knexConfig.client,
    connection: knexConfig.connection
}));
