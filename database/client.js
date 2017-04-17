'use strict';

const _ = require('lodash');
const logger = require('../lib/logger');
const config = require('../config');

// Do not load ORM if we have a disabled database
if (!config.knex.enabled) return;

// Switch between engines
const knexConfig = config.knex.engine === 'sqlite' ? config.knex.sqlite : config.knex.mysql;

// Knex configuration object
const knexBuilder = {
  client: knexConfig.client,
  connection: knexConfig.connection,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: 'database/migrations'
  },
  seeds: {
    directory: 'database/seeds'
  }
};

// Set flags on sqlite instances
if (config.knex.engine === 'sqlite') knexBuilder.useNullAsDefault = true;

const knex = require('knex')(knexBuilder);

// Make sure sqlite uses UTF8
if (config.knex.engine == 'sqlite') knex.raw('PRAGMA encoding = "UTF-8"');

// Update database to latest migration
knex.migrate
  .latest()
  .then(results => {
    if (!results || _.isEmpty(results) || !_.isArray(results[1]) || _.isEmpty(results[1])) return;
    logger.info(`Processing Migration batch ${results[0]}`);
    _.forEach(results[1], result => logger.info(`Adding Migration: ${result}`));
  })
  .catch(err => logger.error(`Error in updating to most recent migration`, {
    err
  }));

// Export bookself
const bookShelf = require('bookshelf')(knex);
require('bookshelf-model-loader').init(bookShelf, {
  plugins: ['virtuals', 'visibility', 'registry', 'pagination'], // Optional - Bookshelf plugins to load. Defaults to loading the 'virtuals', 'visibility' & 'registry' plugins
  excludes: [], // Optional - files to ignore
  path: __dirname + '/models', // Required
  modelOptions: {},
});

// Extend Bookshelf Models
// https://github.com/bsiddiqui/bookshelf-modelbase
require('bookshelf-modelbase')(bookShelf);

module.exports = bookShelf;
