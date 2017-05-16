'use strict';

const _ = require('lodash');
const drunk = require('./drunk');
const config = require('../config');
const logger = require('../lib/logger');
const random = require('./randomEngine');

const matchExpression = /{(.*?)}/gm;
const matchDelim = '|';

const defaultProcessor = text => {
    // Process the random string
    text = text.replace(matchExpression, (match, contents, offset, s) => random.pick(contents.split(matchDelim)));

    return (_.isBoolean(config.drunk) && config.drunk)
        ? drunk(text)
        : text;
};

module.exports = (text, processor) => {
    // Something other then text, or empty text given
    if (!_.isString(text) || _.isEmpty(text))
        return '';

    let result = null;

    // Custom Processor given
    if (_.isFunction(processor)) {
        try {
            result = processor.call(this, text);

            return _.isString(result)
                ? result
                : '';

        } catch (err) {
            logger.error('Error in the preprocessText function', {
                message: err.message || '',
                stack: err.stack || ''
            });

            return _.isString(result)
                ? result
                : '';
        }
    }

    return defaultProcessor(text);
};
