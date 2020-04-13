const scriptInfo = {
    name: 'Money',
    desc: 'Conversions and such',
    createdBy: 'IronY',
};
const _ = require('lodash');
require('lodash-addons');
const request = require('request-promise-native');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');
// Get a monetary symbol
const getSymbol = require('currency-symbol-map');
// Money and Accounting
const fx = require('money');
const accounting = require('accounting-js');
// API Information
const btcApi = 'https://bitpay.com/api/rates'; // API For BTC exchange rates
const coinMarketCapApi = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
const fixerApi = `http://data.fixer.io/api/latest`; // API For Country exchange rates

module.exports = app => {
    const apiKey = _.get(app.Config, 'features.exchangeRate.apiKey', false);
    const coinMarketCapApiKey = _.get(app.Config, 'features.exchangeRate.coinMarketCapApiKey', false);

    if (!apiKey || !coinMarketCapApiKey) {
        logger.warn('A missing api key is preventing for the currency exchange feature from working');
        return scriptInfo;
    }

    // Base currency
    const baseCur = 'EUR';
    const updateScheduleTime = _.get(app.Config, 'features.exchangeRate.updateScheduleTime', {
        hour: [...new Array(24).keys()], // Every hour
        minute: 0, // On the hour
    });

    // Set base currency in money.js
    fx.base = baseCur;

    /**
     * Update Current Rates
     * @returns {Promise<void>}
     */
    const updateCurRatesScheduler = async () => {
        try {
            // Get the initial conversion rates
            const data = await request(fixerApi, {
                json: true,
                method: 'get',
                qs: {
                    access_key: apiKey,
                },
            });

            // No rates available
            if (!_.isObject(data.rates) || _.isEmpty(data.rates)) {
                logger.error('Something went wrong fetching exchange rates', {
                    data,
                });
                return;
            }

            // Received Rates
            logger.info('Updating exchange rates');

            // Adjust rates in money
            fx.rates = data.rates;

            // Get the BTC Rate
            const btcData = await request(btcApi, {
                json: true,
                method: 'get',
            });

            // No Data available
            if (!_.isArray(btcData) || _.isEmpty(btcData)) {
                logger.error('Error fetching BitCoin data for exchange seeding', {
                    btcData,
                });
                return;
            }

            // Find the base currency in the btc info
            const btc = _.find(btcData, o => o.code === baseCur);

            if (!btc || !btc.code || isNaN(btc.rate) || btc.rate === 0) {
                logger.error('Error fetching BitCoin data, data returned is not formatted correctly', {
                    btcData,
                });
                return;
            }

            // Set the BTC rate based on inverse exchange
            fx.rates.BTC = 1 / btc.rate;

            // MISC
            // Get the BTC Rate
            const coinMarketCap = await request(coinMarketCapApi, {
                json: true,
                method: 'get',
                qs: {
                    start: 1,
                    limit: 1,
                    convert: baseCur
                },
                headers: {
                    'X-CMC_PRO_API_KEY': coinMarketCapApiKey
                }
            });
            for (const coin of coinMarketCap.data) {
                if (coin.symbol === 'BTC' && !_.isInteger(coin.quote[baseCur].price)) continue;
                fx.rates[coin.symbol] = 1 / (btc.rate * coin.quote[baseCur].price);
            }
        } catch (err) {
            logger.error('Something went wrong getting currency rates', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };
    scheduler.schedule('updateCurRates', updateScheduleTime, updateCurRatesScheduler);

    // initial run
    if (_.isFunction(scheduler.jobs.updateCurRates.job)) scheduler.jobs.updateCurRates.job();
    // The function does not exist, log error
    else logger.error('Something went wrong with the currency exchange rate job, no function exists');

    /**
     * Exchange Handler
     * @param to
     * @param from
     * @param text
     */
    const exchangeHandler = (to, from, text) => {
        // No exchange rates available
        if (!_.isObject(fx.rates) || _.isEmpty(fx.rates)) {
            app.say(to, `It seems I am without the current exchange rates, sorry ${from}`);
            return;
        }
        // No text available
        if (_.isEmpty(text)) {
            app.say(to, `I need some more information, ${from}`);
            return;
        }
        // Extract variables
        const [amount, cFrom, cTo] = text.split(' ');

        // Normalize amount through accounting
        const normalizedAmount = accounting.unformat(amount);

        // Verify amount is numeric
        if (!normalizedAmount) {
            app.say(to, `Invalid amount or 0 amount given ${from}, I cannot do anything with that`);
            return;
        }

        // Verify we have a target currency
        if (!cFrom) {
            app.say(to, 'I need a currency to convert from');
            return;
        }

        // Normalize
        const normalizedFrom = cFrom.toUpperCase();
        const normalizedTo = (cTo || baseCur).toUpperCase();

        // Attempt conversion
        try {
            // If no cTo is provided, assume default base
            const result = fx.convert(normalizedAmount, {
                from: normalizedFrom,
                to: normalizedTo,
            });

            // Format result and amount thought accounting.js
            const finalResult = accounting.formatMoney(result, {
                symbol: getSymbol(normalizedTo) || '',
            });

            const formattedAmount = accounting.formatMoney(normalizedAmount, {
                symbol: getSymbol(normalizedFrom) || '',
            });

            const formattedDiff = accounting.formatMoney( normalizedAmount - result, {
               symbol: getSymbol(normalizedFrom) || '',
            });
            // Report back to IRC
            app.say(to, `At the current exchange rate ${formattedAmount} ${normalizedFrom} is ${finalResult} ${normalizedTo}. A difference of ${formattedDiff} ${normalizedFrom}, ${from}`);
        }
        // Problem with money.js conversion
        catch (err) {
            app.say(to, `I am unable to convert ${normalizedFrom} to ${normalizedTo} ${from}`);
        }
    };
    app.Commands.set('exchange', {
        desc: '[amount from to?] - Convert currency based on current exchange rates',
        access: app.Config.accessLevels.identified,
        call: exchangeHandler,
    });


    return scriptInfo;
};
