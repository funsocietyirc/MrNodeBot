const rp = require('request-promise-native');
const _ = require('lodash');
const moment = require('moment');

const canadaInfoAPI = require('./_getCanadaOfficialScraper');

const johnHopkinsEndpoint = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=Confirmed%20%3E=%200&returnGeometry=false&&outFields=Province_State,Country_Region,Last_Update,Confirmed,Deaths,Recovered';

/**
 * Helper to check zero
 * @param val1
 * @param val2
 * @returns {string}
 */
const percentileOrNa = (val1, val2) => `${(val1 === 0 || val2 === 0) ? 'N/A' : _.round(_.multiply(_.divide(val1, val2),100),2)}%`;

/**
 * Help Construct human readable date / default
 * @param result
 * @returns {string}
 */
const dateHelper = (result) => {
    const x = result
        .reject(x => x.hasOwnProperty('Last_update'))
        .orderBy(x => x.Last_Update)
        .last();

    if (_.isObject(x)) {
        return moment(x.Last_Update).fromNow();
    }

    return 'No Date Available';
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
 * Produce John Hopkins Results
 * @param region
 * @param city
 * @returns false|{Promise<{}&{location: {}}&{cured: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, dead: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, confirmed: {current: {value: (number|LoDashExplicitWrapper<number>|_.LodashSumBy1x1<any>)}}, lastDate: string}>}
 */
const covid19Results = async (region, city) => {
    const data = await rp({uri: johnHopkinsEndpoint, json: true});

    if (!data || !_.isObject(data) || !data.hasOwnProperty('features')) {
        return false;
    }

    // Flatten and filter out mainland china
    let result = _(data.features).map(x => x.attributes);

    // Prepare output object
    let output = {
        location: {},
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
        output.actual = {
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
        };

        output.actual.stats = {
            mortalityRate: percentileOrNa(output.actual.dead.current.value, output.actual.confirmed.current.value),
            recoveryRate: percentileOrNa(output.actual.cured.current.value, output.actual.confirmed.current.value),
            activeRate: output.actual.confirmed.current.value - output.actual.dead.current.value - output.actual.cured.current.value,
        };

        // Filter out Mainland China
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

    _.merge(output, {
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

    // Post flight
    if (
        output.confirmed.current.value === 0
    ) {
        return false;
    }

    // Add Stats
    output.stats = {
        mortalityRate: percentileOrNa(output.dead.current.value, output.confirmed.current.value),
        recoveryRate: percentileOrNa(output.cured.current.value, output.confirmed.current.value),
        activeRate: output.confirmed.current.value - output.dead.current.value - output.cured.current.value,
    };

    return output;
};

module.exports = covid19Results;
