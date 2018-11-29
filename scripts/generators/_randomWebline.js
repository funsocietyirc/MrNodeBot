const _ = require('lodash');
const logger = require('../../lib/logger');

const bofh = require('../generators/_bofhExcuse');
const shower = require('../generators/_showerThoughts');
const fml = require('../generators/_fmlLine');
const advice = require('../generators/_getAdviceSlip');
const chuck = require('../generators/_getChuckNorris');
const til = require('../generators/_tilLine');
const tifu = require('../generators/_tifuLine');

module.exports = async () => {
    try {
        const results = await _.sample([
            bofh,
            shower,
            fml,
            advice,
            chuck,
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
