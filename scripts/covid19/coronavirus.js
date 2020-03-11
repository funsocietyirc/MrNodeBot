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

/**
 * Helper to append Result
 * @param obj Object Results Object
 * @param output
 * @param label string Label
 * @param color string Display Color
 */
const appendResult = (obj, output, label, color) => {
    output = output.append(c[color](`${helpers.formatNumber(obj.current.value)} ${label}`));
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

            output.appendBold('Confirmed');

            _.forEach(results, (value, region) => {
                output.appendBold(_.startCase(region));
                output.append(helpers.formatNumber(value));
            });

            app.say(to, output.text);
        }
        catch (err) {
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
         * @param obj
         */
        const appendStats = (obj) => {
            output.appendBold(`Mortality: ${c.red(obj.mortalityRate)}`);
            output.appendBold(`Recovery: ${c.green(obj.recoveryRate)}`);
            output.appendBold(`Active: ${c.blue(helpers.formatNumber(obj.activeRate))}`);
        };

        // Output to IRC
        const output = new typo.StringBuilder({
            logo: 'coronavirus',
        });

        // Create Output
        output.appendBold(`${result.location.city ? result.location.city : result.location.region ? result.location.region : 'Global Without Mainland China'} - ${result.lastDate}`);

        appendResult(result.confirmed, output, 'Confirmed', 'yellow');
        appendResult(result.cured, output, 'Cured', 'green') ;
        appendResult(result.dead, output, 'Dead', 'red');
        appendStats(result.stats);

        if(result.hasOwnProperty('actual')) {
            output.appendBold('With China');
            appendResult(result.actual.confirmed, output, 'Confirmed', 'yellow');
            appendResult(result.actual.cured, output, 'Cured', 'green') ;
            appendResult(result.actual.dead, output, 'Dead', 'red');
            appendStats(result.actual.stats);
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
