const _ = require('lodash');
const drunk = require('./drunk');
const slicc = require('./sliccText');
const config = require('../config');
const logger = require('../lib/logger');
const random = require('./randomEngine');

// Random String Formatting
const matchExpression = /{(.*?)}/gm;
const matchDelim = '|';

const defaultProcessor = (text) => {
    // Process the random string format
    text = text.replace(matchExpression, (match, contents, offset, s) => random.pick(contents.split(matchDelim)));
    text = (_.isBoolean(config.drunk) && config.drunk) ? drunk(text) : text;
    return (_.isBoolean(config.slicced) && config.slicced) ? slicc(text) : text;
};

module.exports = (text, processor) => {
    // Something other then text, or empty text given
    if (!_.isString(text) || _.isEmpty(text)) { return ''; }

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
                stack: err.stack || '',
            });

            return _.isString(result)
                ? result
                : '';
        }
    }

    return defaultProcessor(text);
};
