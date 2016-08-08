const config = require('../config');

// Export a bookshelf instance
module.exports = require('bookshelf')(require('knex')({
    client: config.dbEngine,
    connection: {
        host: config.dbHost,
        user: config.dbUser,
        password: config.dbPass,
        database: config.dbSchema,
        charset: 'utf8'
    }
}));
