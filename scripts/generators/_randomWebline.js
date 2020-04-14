const _ = require('lodash');
const logger = require('../../lib/logger');

const shower = require('../generators/_showerThoughts');
const fml = require('../generators/_fmlLine');
const advice = require('../generators/_getAdviceSlip');
const til = require('../generators/_tilLine');
const tifu = require('../generators/_tifuLine');

module.exports = async () => {
    try {
        const results = await _.sample([
            shower,
            fml,
            advice,
            til,
            tifu,
        ])();
        return _.isArray(results) ? _(results).first() : results;
    } catch (err) {
        logger.error('Something went wrong in the _randomWebline file', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};
