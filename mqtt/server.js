const _ = require('lodash');
const mosca = require('mosca');

/**
 * Promise wrapper around Mosca
 * @returns {Promise<any>}
 */
const init = (config, logger) => new Promise((res) => {
    try {
        if (!_.isObject(config.mqtt) || _.isEmpty(config.mqtt) || !_.isBoolean(config.mqtt.enabled) || !config.mqtt.enabled) {
            return res(false);
        }

        logger.info('Initializing MQTT');

        // Normalize Configuration
        const normalizedConfig = (_.isString(config.mqtt.persistence) && !_.isEmpty(config.mqtt.persistence)) ?
            Object.assign({},config.mqtt, {
                persistence: {
                    factory: mosca.persistence[config.mqtt.persistence],
                    url: config.mqtt.backend.url
                },
            }) : config.mqtt;

        // Initialize Server
        const server = new mosca.Server(normalizedConfig);

        server.on('ready', () => {
            // TODO attach authentication, block any publish
            server.authorizePublish = function(client, topic, payload, callback) {
                callback(null, false);
            };

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
