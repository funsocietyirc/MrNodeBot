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
const fixerApi = 'http://api.fixer.io/latest'; // API For Country exchange rates
const btcApi = 'https://bitpay.com/api/rates'; // API For BTC exchange rates
const coinMarketCapApi = 'https://api.coinmarketcap.com/v1/ticker';

module.exports = (app) => {
    // Base currency
    const baseCur = _.getString(_.get(app.Config, 'features.exchangeRate.base'), 'USD').toUpperCase();
    const updateScheduleTime = _.get(app.Config, 'features.exchangeRate.updateScheduleTime', {
        hour: [...new Array(24).keys()], // Every hour
        minute: 0, // On the hour
    });

    // Set base currency in money.js
    fx.base = baseCur;

    scheduler.schedule('updateCurRates', updateScheduleTime, async () => {
        try {
            // Get the initial conversion rates
            const data = await request(fixerApi, {
                json: true,
                method: 'get',
                qs: {
                    base: baseCur,
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
            });

            for (const coin of coinMarketCap) {
                if (coin.symbol === 'BTC') continue;
                console.dir(coin);
                fx.rates[coin.symbol] = 1 / (btc.rate * coin.price_btc);
            }
            console.dir(fx.rates);

        } catch (err) {
            logger.error('Something went wrong getting currency rates', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    });

    // initial run
    if (_.isFunction(scheduler.jobs.updateCurRates.job)) scheduler.jobs.updateCurRates.job();

    // The function does not exist, log error
    else logger.error('Something went wrong with the currency exchange rate job, no function exists');

    // Provide exchange
    const exchange = (to, from, text, message) => {
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

            // Report back to IRC
            app.say(to, `At the current exchange rate ${formattedAmount} ${normalizedFrom} is ${finalResult} ${normalizedTo}, ${from}`);
        }
        // Problem with money.js conversion
        catch (err) {
            app.say(to, `I am unable to convert ${normalizedFrom} to ${normalizedTo} ${from}`);
        }
    };

    // Evaluate
    app.Commands.set('exchange', {
        desc: '[amount from to?] - Convert currency based on current exchange rates',
        access: app.Config.accessLevels.identified,
        call: exchange,
    });


    return scriptInfo;
};
