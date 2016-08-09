const config = require('../config');

// Switch between engines
const knexConfig = config.knex.engine === 'sqlite' ? config.knex.sqlite : config.knex.mysql;
const knexBuilder = {
    client: knexConfig.client,
    connection: knexConfig.connection,
};
// Set flags on sqlite instances
if (config.knex.engine === 'sqlite') {
    knexBuilder.useNullAsDefault = true;
}
// Export bookself
module.exports = require('bookshelf')(require('knex')(knexBuilder));
