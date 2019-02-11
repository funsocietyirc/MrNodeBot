const _ = require('lodash');
const mosca = require('mosca');
const config = require('../config');
const logger = require('../lib/logger');

/**
 * Promise wrapper around Mosca
 * @returns {Promise<any>}
 */
const init = () => new Promise((res, rej) => {
    try {
        if (!_.isObject(config.mqtt) || _.isEmpty(config.mqtt) || !_.isBoolean(config.mqtt.enabled) || !config.mqtt.enabled) {
            return res(false);
        }

        logger.info('Initializing MQTT');
        const server = new mosca.Server(config.mqtt);
        server.on('ready', () => {
            logger.info('MQTT Ready');
            res(server);
        });
    }
    catch (err) {
        logger.error(`Something went wrong attempting to initialize MQTT server`, {
            message: err.message || '',
            stack: err.stack || '',
        });

        res(false);
    }
});

module.exports = init;
