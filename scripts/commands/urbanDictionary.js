const scriptInfo = {
    name: 'Urban Dictionary',
    desc: 'Look up a term with the urban dictionary',
    createdBy: 'IronY',
};
const _ = require('lodash');
const dict = require('../generators/_getUrbanDictionaryDefinition');
const short = require('../lib/_getShortService')();
const logger = require('../../lib/logger.js');

module.exports = app => {

    /**
     * Urban Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const urbanHandler = async (to, from, text) => {
        try {
            const results = await dict(text);
            const definition = _.truncate(results.definition, {
                length: 300,
            });
            const shortUrl = await short(results.url);

            app.say(to, `${results.term}: ${definition} - ${shortUrl}`);
        } catch (err) {
            logger.error('Something went wrong in the urbanDictionary.js file', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Urban Dictionary Error: ${err.message}`);
        }
    };
    app.Commands.set('urban', {
        desc: '[term] - Urban Dictionary Lookup',
        access: app.Config.accessLevels.identified,
        call: urbanHandler,
    });

    return scriptInfo;
};
