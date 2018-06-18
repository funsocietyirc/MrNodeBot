const _ = require('lodash');
const logger = require('../../lib/logger');

const bofh = require('../generators/_bofhExcuse');
const shower = require('../generators/_showerThoughts');
const fml = require('../generators/_fmlLine');

module.exports = async () => {
    try {
        const results = await _.sample([bofh, shower, fml])(1);
        return _(results).first();
    } catch (err) {
        logger.error('Something went wrong in the _randomWebline file', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};
