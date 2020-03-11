const rp = require('request-promise-native');
const _ = require('lodash');
const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../lib/logger');

// End Points
const covid19HealthEndPoint = 'https://covid19.health/data/all.json';
const johnHopkinsEndpoint = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=Confirmed%20%3E=%200&returnGeometry=false&&outFields=Province_State,Country_Region,Last_Update,Confirmed,Deaths,Recovered';

/**
 * Helper to check zero
 * @param val1
 * @param val2
 * @returns {string}
 */
const percentileOrNa = (val1, val2) => `${(val1 === 0 || val2 === 0) ? 'N/A' : _.round(_.multiply(_.divide(val1, val2),100),2)}%`;


/**
 * Produce John Hopkins Results
 * @param region
 * @param city
 * @returns false|{Promise<{}&{location: {}}&{cured: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, dead: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, confirmed: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, lastDate: string}>}
 */
const produceJohnHopkinsResults = async (region, city) => {
    const data = await rp({uri: johnHopkinsEndpoint, json: true});

    if (!data || !_.isObject(data) || !data.hasOwnProperty('features')) {
        return false;
    }

    // Flatten and filter out mainland china
    let result = _(data.features).map(x => x.attributes);
    /**
     *
     * @param city
     * @returns {string}
     */
    const formatCity = city => _.trim(_.startCase(_.toLower(city)));

    /**
     * Normalize and Format Region
     * @param region
     * @returns {string}
     */
    const formatRegion = region => {
        const lower = _.trim(_.toLower(region));
        switch (lower) {
            case null:
            case '':
            case 'world':
            case 'global':
                return 'Global without China';
            case 'us':
            case 'usa':
            case 'united states':
            case 'america':
            case 'united states of america':
                return 'US';
            case 'uk':
            case 'UK':
            case 'Uk':
            case 'united kingdom':
            case 'United Kingdom':
            case 'u.k':
            case 'U.K':
                return 'UK';
            default:
                return _.startCase(lower);
        }
    };

    /**
     * Output Helper
     * @param result
     * @returns {{} & {location: {}} & {cured: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, dead: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, confirmed: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, lastDate: string}}
     */
    const outputHelper = (result) => Object.assign({}, output, {
        confirmed: {
            current: {
                value: result.sumBy('Confirmed')
            }
        },
        cured: {
            current: {
                value: result.sumBy('Recovered')
            }
        },
        dead: {
            current: {
                value: result.sumBy('Deaths')
            }
        },
        lastDate: dateHelper(result)
    });

    /**
     * Help Construct human readable date / default
     * @param result
     * @returns {string}
     */
    const dateHelper = (result) => {
        const x = result
            .orderBy(x => new moment(x.Last_Update).format('YYYYMMDD'))
            .last();

        if (_.isObject(x) &&  x.hasOwnProperty('Last_Update')) {
            return moment(x.Last_Update).fromNow();
        }

        return 'No Date Available';
    };

    // Prepare output object
    let output = {
        location: {}
    };

    // Formatted Region
    const formattedRegion = output.location.region = formatRegion(region);

    // We have a region but no city
    if (region && region !== 'Global') {
        result = result
            .filter(
                x =>
                    x.hasOwnProperty('Country_Region') &&
                    x.Country_Region.startsWith(formattedRegion)
            );


        // Post Filter Check
        if (_.isEmpty(result.value())) {
            return false;
        }

    } else {

        // Apply Actual Stats
        output.actual = outputHelper(result);

        // Add Stats
        Object.assign(output.actual, {
            stats: {
                mortalityRate: percentileOrNa(output.actual.dead.current.value, output.actual.confirmed.current.value),
                recoveryRate: percentileOrNa(output.actual.cured.current.value, output.actual.confirmed.current.value),
                activeRate: output.actual.confirmed.current.value - output.actual.dead.current.value - output.actual.cured.current.value,
            }
        });
        result = result.reject(
            x =>
                x.hasOwnProperty('Country_Region') &&
                x.Country_Region === 'Mainland China'
        )
    }

    if (city) {
        const formattedCity =  output.location.city = formatCity(city);
        result = result
            .filter(
                x => x
                    .hasOwnProperty('Province_State') &&
                    !_.isNil(x.Province_State) &&
                    x.Province_State.split(',')[0].startsWith(formattedCity)
            );
    }

    // Preflight
    if (!result || _.isEmpty(result)) {
        return false;
    }

    output = outputHelper(result);

    // Post flight
    if (
        output.confirmed.current.value === 0
    ) {
        return false;
    }

    // Add Stats
    Object.assign(output, {
        stats: {
            mortalityRate: percentileOrNa(output.dead.current.value, output.confirmed.current.value),
            recoveryRate: percentileOrNa(output.cured.current.value, output.confirmed.current.value),
            activeRate: output.confirmed.current.value - output.dead.current.value - output.cured.current.value,
        }
    });

    return output;
};

/**
 * Produce Output results
 * @param region
 * @param city
 * @returns {{location: {city: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}|boolean}
 */
const produceCovid19HealthResults = async (region, city) => {

    /**
     * Append Stat Object (Mutating)
     * @param intermResults
     * @param output
     * @param prop
     * @param key
     */
    const appendStat = (intermResults, output, prop, key) => {
        if (
            intermResults.hasOwnProperty(prop) &&
            _.isObject(intermResults[prop]) &&
            !_.isEmpty(intermResults[prop])
        ) {
            const innerData = intermResults[prop];
            output[key] = {
                current: {
                    value: helpers.getValueFromObj(innerData, -1),
                    date: helpers.getKeyFromObj(innerData, -1)
                },
                previous: {
                    value: helpers.getValueFromObj(innerData, -2),
                    date: helpers.getKeyFromObj(innerData, -2)
                },
            };
            // Append computed props
            output[key].delta = output[key].current.value - output[key].previous.value;
        }
    };

    /**
     *
     * @param city
     * @returns {string}
     */
    const formatCity = city => _.trim(_.startCase(_.toLower(city)));

    /**
     * Normalize and Format Region
     * @param region
     * @returns {string}
     */
    const formatRegion = region => {
        const lower = _.trim(_.toLower(region));
        switch (lower) {
            case null:
            case '':
            case 'world':
            case 'global':
            case 'earth':
                return 'Global';
            case 'us':
            case 'usa':
            case 'united states':
            case 'america':
            case 'united states of america':
                return 'United States of America';
            case 'uk':
            case 'united kingdom':
            case 'britain':
                return 'United Kingdom';
            default:
                return _.startCase(lower);
        }
    };

    // Gather results
    const data = await rp({uri: covid19HealthEndPoint, json: true});

    // Pre Flight Check
    if (!_.isObject(data) || _.isEmpty(data)) {
        return false;
    }

    // Normalize Region Name
    const formattedRegion = formatRegion(region);

    // Normalize Down to Region
    let intermResults = _(data).filter(x => x.ENGLISH === formattedRegion);

    // Province provided
    if (_.isString(city) && !_.isEmpty(city)) {
        const formattedCity = formatCity(city);
        intermResults = _
            .filter(
                intermResults.omit(['confirmedCount', 'deadCount', 'curedCount']).value()[0],
                x => x.hasOwnProperty('ENGLISH') && x.ENGLISH.split(',')[0] === formattedCity
            );
    }

    // Hold on to final results
    const finalResults = _.isFunction(intermResults.value) ?  intermResults.value()[0] : intermResults[0];

    // Post Flight Check
    if (!_.isObject(finalResults) || _.isEmpty(finalResults)) {
        return false;
    }

    // Hold on to the potential result factors
    const hasCured = finalResults.hasOwnProperty('curedCount');
    const hasDead = finalResults.hasOwnProperty('deadCount');
    const hasConfirmed = finalResults.hasOwnProperty('confirmedCount');

    // Prepare output object
    let output = {
        location: {
            region: formattedRegion,
            city,
        },
        has: {
            cured: hasCured,
            confirmed: hasConfirmed,
            dead: hasDead,
        },
    };

    // Append Stats
    appendStat(finalResults, output, 'confirmedCount', 'confirmed');
    appendStat(finalResults, output, 'curedCount', 'cured');
    appendStat(finalResults, output, 'deadCount', 'dead');

    // Append last Date
    output.lastDate =
        hasConfirmed ? output.confirmed.current.date : (
            hasCured ? output.cured.current.date : (
                hasDead ? output.dead.current.date : 'No Date Available'
            )
        );

    return output;
};

/**
 * Generate output
 * SARS-CoV-2 Global (Excluding Main Land China) - 5 hours ago → 30,628 Confirmed → 3,664 Cured → 772 Dead
 * @param region
 * @param city
 * @returns {Promise<boolean|{location: {province: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}>}
 */
const genRealtime = async (region, city) => {
    try {
        return await produceJohnHopkinsResults(region, city);
    } catch (err) {
        logger.error('Something went wrong getting information from John Hopkins', {
            message: err.message || '',
            stack: err.stack || ''
        });

        const error = new Error('Something went wrong getting information from John Hopkins.');
        error.innerErr = err;
        throw error;
    }
};
/**
 * Gen
 * @param region
 * @param city
 * @returns {Promise<*>}
 */
const gen = async (region, city) => {
    try {
         return await produceCovid19HealthResults(region, city);
    } catch (err) {
        logger.error('Something went wrong getting information from Covid19.health', {
            message: err.message || '',
            stack: err.stack || ''
        });

        const error = new Error('Something went wrong getting information from Covid19Health.');
        error.innerErr = err;
        throw error;
    }
};

module.exports = {
    genRealtime,
    gen,
};
