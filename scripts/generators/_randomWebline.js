'use strict';
const _ = require('lodash');
const logger = require('../../lib/logger');

const fml = require('../generators/_fmlLine');
const twss = require('../generators/_twssLine');
const bofh = require('../generators/_bofhExcuse');
const shower = require('../generators/_showerThoughts');

module.exports = async () => {
    try {
        const results = await _.sample([fml, bofh, shower, twss])(1);
        return _(results).first();
    }
    catch(err) {
        logger.error('Something went wrong in the _randomWebline file', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};