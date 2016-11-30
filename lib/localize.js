'use strict';

// TODO Move to configuration file
const i18next = require('i18next');
const backend = require('i18next-sync-fs-backend');
const logger = require('./logger');
const config = require('../config');
const path = require('path');

i18next
    .use(backend)
    .init({
        lng: 'en',
        preload: ['en'],
        load: 'current',
        debug: config.bot.debug,
        ns: ['app','libraries'],
        defaultNS: 'app',
        whitelist: ['en'],
        saveMissing: true,
        saveMissingTo: 'current',
        fallbackLng: "en",
        initImmediate: false,
        // path where resources get loaded from
        backend: {
            loadPath: path.normalize(__dirname + '/../localization/{{lng}}/{{ns}}.json'),
            // path to post missing resources
            addPath:  path.normalize(__dirname + '/../localization/{{lng}}/{{ns}}.missing.json'),
            // jsonIndent to use when storing json files
            jsonIndent: 2,
        },
    });

// Log Initialization
i18next.on('initialized', options => logger.info(`Localization Initialized`));

// Log loaded
i18next.on('loaded', loaded => logger.info('Localization has finished loading assets'));

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

// Switch the final languge to establish a ready state
// TODO There has to be a more elogent way of doing this
i18next.changeLanguage('en', (err, t) => {
  module.exports = t;
});
