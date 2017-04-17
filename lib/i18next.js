'use strict';
const _ = require('lodash');
require('lodash-addons');
const path = require('path');
const config = require('../config');
const logger = require('./logger');
const i18next = require('i18next');
const backend = require('i18next-sync-fs-backend');
i18next
  .use(backend)
  .init({
    lng: _.getString(_.get(config, 'localization.lng'), 'en'),
    preload: _.getArray(_.get(config, 'localization.preload'), ['en']),
    load: _.getString(_.get(config, 'localization.load'), 'current'),
    debug: _.getBoolean(_.get(config, 'localization.debug'), false),
    ns: _.getArray(_.get(config, 'localization.ns'), ['app', 'libraries']),
    defaultNS: _.getString(_.get(config, 'localization.defaultNS'), 'app'),
    whitelist: _.getArray(_.get(config, 'localization.whitelist'), ['en']),
    saveMissing: _.getBoolean(_.get(config, 'localization.saveMissing'), true),
    saveMissingTo: _.getString(_.get(config, 'localization.saveMissingTo'), 'current'),
    fallbackLng: _.getString(_.get(config, 'localization.fallbackLng'), 'en'),
    initImmediate: _.getBoolean(_.get(config, 'localization.initImmediate'), false),
    // path where resources get loaded from
    backend: {
      loadPath: path.normalize(__dirname + '/../localization/{{lng}}/{{ns}}.json'),
      // path to post missing resources
      addPath: path.normalize(__dirname + '/../localization/{{lng}}/{{ns}}.missing.json'),
      // jsonIndent to use when storing json files
      jsonIndent: 2,
    },
  });

// Log Initialization
i18next.on('initialized', options => logger.info(`Localization Initialized`));

// Log loaded
i18next.on('loaded', loaded => logger.info('Localization has finished loading assets'));

// Log added
i18next.on('added', (lng, ns) => logger.info(`Translation added ${lng} ${ns}`));

// Log Failed loading
i18next.on('failedLoading', (lng, ns, msg) => logger.error(`Invalid Translation`, {
  lng,
  ns,
  msg
}));

// Log Missing key
i18next.on('missingKey', (lngs, namespace, key, res) => logger.error(`Translation is missing key`, {
  lngs,
  namespace,
  key,
  res
}));

module.exports = i18next;
