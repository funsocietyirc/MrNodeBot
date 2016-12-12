'use strict';

const scriptInfo = {
    name: 'Money',
    desc: 'Conversions and such',
    createdBy: 'IronY'
};

const _ = require('lodash');
require('lodash-addons');
const fx = require('money');
const request = require('request-promise-native');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');

// Base currency
const baseCur = 'USD';
// Set base currency in money.js
fx.base = baseCur;

module.exports = app => {
    // Base currency
    const baseCur = _.getString(_.get(app.Config, 'features.exchangeRate.base'), 'USD').toUpperCase();
    // Set base currency in money.js
    fx.base = baseCur;

    const updateRates = scheduler.schedule('updateCurRates', {
            hour: [new scheduler.Range(0, 23)]
        }, () =>
        request('http://api.fixer.io/latest', {
            json: true,
            method: 'get',
            qs: {
                base: baseCur
            }
        })
        // Set the rate sin money.js
        .then(data => {
            // No rates available
            if (!_.isObject(data.rates) || _.isEmpty(data.rates)) {
                logger.error(`Something went wrong fetching exchange rates`, {
                    data
                });
                return;
            }
            // Received Rates
            logger.info('Updating exchange rates', {
                rates: data.rates
            });
            // Adjust rates in money
            fx.rates = data.rates
        })
        .catch(err => logger.error('Something went wrong getting currency rates', {
            err
        }))
    );
    // initial run
    scheduler.jobs.updateCurRates.job();

    // Provide exchange
    const exchange = (to, from, text, message) => {
        // No text available
        if (_.isEmpty(text)) {
            app.say(to, `I need some more information ${from}`);
            return;
        }
        let [amount, cFrom, cTo] = text.split(' ');
        if (!_.isSafeInteger(_.parseInt(amount))) {
            app.say(to, `That is not a valid amount ${from}`);
            return;
        }
        if (!cFrom) {
            app.say(to, `I need a currency to convert from`);
            return;
        }
        // Normalize
        cFrom = cFrom.toUpperCase();
        cTo = cTo.toUpperCase() || baseCur;
        // Attempt conversion
        try {
            // If no cTo is provided, assume USD
            let result = fx.convert(amount, {
                from: cFrom,
                to: cTo
            });
            app.say(to, `At the current exchange rate ${amount} ${cFrom} is ${result.toFixed(2)} ${cTo}, ${from}`);
        } catch (err) {
            app.say(to, `I am unable to convert ${cFrom} to ${cTo} ${from}`);
        }
    };

    // Evaluate
    app.Commands.set('exchange', {
        desc: '[amount from to?] - Convert currency based on current exchange rates',
        access: app.Config.accessLevels.identified,
        call: exchange
    });


    return scriptInfo;
};
