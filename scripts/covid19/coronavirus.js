const scriptInfo = {
    name: 'CoronaVirus',
    desc: 'CoronaVirus stats',
    createdBy: 'IronY',
};

const corona = require('./_coronavirus');
const _ = require('lodash');
const typo = require('../lib/_ircTypography');
const helpers = require('../../helpers');
const c = require('irc-colors');
const logger = require('../../lib/logger');

/**
 * Helper to append Result
 * @param obj Object Results Object
 * @param output function Output Helper
 * @param label string Label
 * @param color string Display Color
 * @param diff? Object Diff Object
 */
const appendResult = (obj, output, label, color, diff) => {
    output = output
        .append(
    `${c[color](helpers.formatNumber(obj.current.value))}${_.isObject(diff) ? '(' + c[color](helpers.formatNumber(obj.current.value - diff.current.value)) + ')' : ''} ${label}`
        );
    if (obj.hasOwnProperty('delta')) {
        output =  output.append(c.blue(`${helpers.formatNumber(obj.delta)} +/-`));
    }
    return output;
};

module.exports = (app) => {
    const covid19Canada = async (to, from, text, message) => {
        try {
            const results = await corona.covidCanadaResults();

            if(!results || !_.isObject(results) || _.isEmpty(results)) {
                app.say(to, `There seems to be no Canadian information available, ${from}`);
                return;
            }

            // Output to IRC
            const output = new typo.StringBuilder({
                logo: 'coronavirus',
            });

            output.appendBold('Canada');

            _.forEach(results, (value, region) => {
                output.insert(`[${_.startCase(region)}] ${helpers.formatNumber(value.confirmed)} Con${value.probable > 0 ? ' ' + helpers.formatNumber(value.probable) + ' Prob' : ''}`);
            });

            app.say(to, output.text);
        }
        catch (err) {
            logger.error('Something went wrong with the Canadian Information', {
                message: err.message || '',
                stack: err.stack || '',
                to, from
            });
            app.say(to, `Something went wrong fetching the Canadian information, ${from}`);
        }
    };
    app.Commands.set('covid19-canada', {
        desc: 'COVID-19 Numbers Provided By Canadian Government',
        access: app.Config.accessLevels.identified,
        call: covid19Canada,
    });

    const covid19 = async(to, from, text, message) => {
        // Split on comma
        const [region, city] = text.split(',');

        // Get Results
        const result = await corona.covid19Results(region, city);
        // No Results
        if (
            !result ||
            !_.isObject(result) ||
            _.isEmpty(result)
        ) {
            app.say(to, `I have no confirmed results for ${region}${city ? ', ' + city : '' }, ${from}`);
            return;
        }

        /**
         * Stats Helper
         * @param obj Object Results object
         * @param diff? Object Diff Results object
         */
        const appendStats = (obj,diff) => {
            output.appendBold(`Mortality: ${c.red(obj.mortalityRate)}`);
            output.appendBold(`Recovery: ${c.green(obj.recoveryRate)}`);

            output
                .appendBold(
                    `Active: ${c.blue(helpers.formatNumber(obj.activeRate))}${_.isObject(diff) ? '(' + c.blue(helpers.formatNumber(obj.activeRate - diff.activeRate)) + ')' : ''}`
                );
        };

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Create Output
        output.appendBold(`${result.location.city ? result.location.city : result.location.region ? result.location.region : 'Global Without Mainland China'} ${c.lightgreen(result.lastDate)}`);

        // Append Confirmed
        appendResult(
            result.confirmed,
            output,
            'Confirmed',
            'yellow'
        );
        // Append Cured
        appendResult(result.cured,
            output,
            'Cured',
            'green') ;
        // Append Dead
        appendResult(result.dead,
            output,
            'Dead',
            'red'
        );
        // Append stats
        appendStats(result.stats);

        if(result.hasOwnProperty('actual')) {
            output.appendBold(c.lightgreen(`With China`));
            // Append Confirmed
            appendResult(
                result.actual.confirmed,
                output,
                'Confirmed',
                'yellow',
                result.confirmed,
            );
            // Append Cured
            appendResult(
                result.actual.cured,
                output,
                'Cured',
                'green',
                result.cured,
            );
            // Append Result
            appendResult(
                result.actual.dead,
                output,
                'Dead',
                'red',
                result.dead
            );
            // Append Stats
            appendStats(result.actual.stats, result.stats);
        }

        // Say Output
        app.say(to, output.text);
    };

    app.Commands.set('covid19', {
        desc: '[Region]?, [City/Province]? - COVID-19 Facts Provided By John Hopkins',
        access: app.Config.accessLevels.identified,
        call: covid19,
    });


    /**
     * Coronavirus command handler
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const covid19Stats = async (to, from, text, message) => {
        // Split on comma
        const [region, province] = text.split(',');
        // Get Results
        const result = await corona.covid19StatsResults(region, province);
        // No Results
        if (
            !result ||
            !_.isObject(result) ||
            _.isEmpty(result)
        ) {
            app.say(to, `I got nothing, ${from}`);
            return;
        }

        // No Data
        if (
            !result.has.cured && !result.has.dead && !result.has.confirmed
        ) {
            app.say(to, `I have no Coronavirus information for ${result.location.region} ${result.location.province ? result.location.province : ''}, ${from}`);
            return;
        }

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Create Output
        output.appendBold(`${result.location.city ? result.location.city : result.location.region} - ${result.lastDate}`);

        if (result.has.confirmed) appendResult(result.confirmed, output, 'Confirmed', 'yellow');
        if (result.has.cured) appendResult(result.cured, output, 'Cured', 'green') ;
        if (result.has.dead)  appendResult(result.dead, output, 'Dead', 'red');

        // Say Output
        app.say(to, output.text);
    };

    /**
     * Export Command
     */
    app.Commands.set('covid19-stats', {
        desc: '[Region]?, [City]?  - COVID-19 Stats Compiled daily by https://covid19.health',
        access: app.Config.accessLevels.identified,
        call: covid19Stats,
    });

    // Return the script info
    return scriptInfo;
};
