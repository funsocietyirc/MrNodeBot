/**
 * @module weather
 * @author Dave Richer
 */
const scriptInfo = {
    name: 'weather',
    desc: 'Get Weather data',
    createdBy: 'IronY',
};
const _ = require('lodash');
require('lodash-addons');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
// Localizations
const t = require('../../lib/localize');
const i18next = require('../../lib/i18next');

i18next.addResources('en', 'weather', {});
const apiEndpoint = 'https://api.worldweatheronline.com/free/v2/weather.ashx';
const numOfDaysDefault = 1;

/**
 * Weather Data script
 * @param {Object} app A MrNodeBot object
 * @returns {Object} scirpt information
 */
module.exports = (app) => {
    // Check we have API Key
    if (!_.has(app.Config, 'apiKeys.worldWeatherOnline.key') || _.isEmpty(app.Config.apiKeys.worldWeatherOnline)) return scriptInfo;

    /**
     * getWeather - Description
     * @param {String} location The Location desired
     * @returns {Promise} A Json object containing the weather data requested
     * @throws {Error}
     */
    const getWeather = location => new Promise((res, rej) => {
        if (!_.isString(location) || _.isEmpty(location)) return rej(new Error('I need a location to get the weather from'));
        // Return the Weather data
        return rp(apiEndpoint, {
            qs: {
                q: location,
                num_of_data: numOfDaysDefault,
                format: 'json',
                key: app.Config.apiKeys.worldWeatherOnline.key,
            },
        })
            .catch((err) => {
                logger.warn('Error fetching Weather info', {
                    err,
                });
                rej(new Error('There was an Error fetching the weather information'));
            });
    });

    return scriptInfo;
};
