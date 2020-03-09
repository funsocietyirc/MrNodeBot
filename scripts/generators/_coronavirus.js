const rp = require('request-promise-native');
const _ = require('lodash');
const helpers = require('../../helpers');
const moment = require('moment');

// End Points
const covid19HealthEndPoint = 'https://covid19.health/data/all.json';
const johnHopkinsEndpoint = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=Confirmed%20%3E=%200&returnGeometry=false&&outFields=Province_State,Country_Region,Last_Update,Confirmed,Deaths,Recovered';


/**
 * Produce John Hopkins Results
 * @param region
 * @param city
 * @returns {Promise<({}&{cured: {current: {value: number}}, location: {city: (null|string), region: string}, dead: {current: {value: number}}, confirmed: {current: {value: number}}})|boolean>}
 */
const produceJohnHopkinsResults = async (region, city) => {
    const data = await rp({uri: johnHopkinsEndpoint, json: true});

    if (!data || !_.isObject(data) || !data.hasOwnProperty('features')) {
        return false;
    }

    // Flatten and filter out mainlan china
    let result = _(data.features).map(x => x.attributes).reject(
        x => x
            .hasOwnProperty('Country_Region') &&
            x.Country_Region === 'Mainland China'
    );
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
                return 'Global (Excluding Main Land China)';
            case 'us':
            case 'usa':
            case 'united states':
            case 'america':
            case 'united states of america':
                return 'US';
            case 'uk':
            case 'UK':
            case 'united kingdom':
            case 'United Kingdom':
                return 'Uk';
            default:
                return _.startCase(lower);
        }
    };

    /**
     * Output Helper
     * @param result
     * @returns {{} & {cured: {current: {value: number}}, location: {city: null|string, region: string}, dead: {current: {value: number}}, confirmed: {current: {value: number}}}}
     */
    const outputHelper = (result) => output = Object.assign({}, output, {
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
        lastDate: moment(result.orderBy(x => new moment(x.Last_Update).format('YYYYMMDD')).last().Last_Update).fromNow()
    });

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
                x => x
                    .hasOwnProperty('Country_Region') &&
                    x.Country_Region.startsWith(formattedRegion)
            );
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

    output = outputHelper(result);

    // Final Content Check
    if (
        output.confirmed.current.value === 0
    ) {
        return false;
    }

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
                x => x.hasOwnProperty('ENGLISH') && x.ENGLISH.split(',')[0].startsWith(formattedCity)
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
 * @param region
 * @param city
 * @returns {Promise<boolean|{location: {province: *, region: string}, has: {cured: boolean, dead: boolean, confirmed: boolean}, lastDate: *}>}
 */
const genRealtime = async (region, city) => {
    try {
        return await produceJohnHopkinsResults(region, city);
    } catch (err) {
        console.dir(err);
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
        const error = new Error('Something went wrong getting information from Covid19Health.');
        error.innerErr = err;
        throw error;
    }
};

module.exports = {
    genRealtime,
    gen,
};
