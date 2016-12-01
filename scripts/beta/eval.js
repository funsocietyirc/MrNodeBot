'use strict';

const scriptInfo = {
    name: 'Evaluate',
    desc: 'Allow for inline JS Evaluation via IRC for easier debugging',
    createdBy: 'IronY'
};

const _ = require('lodash');
const util = require('util');
const logger = require('../../lib/logger.js');

module.exports = app => {
    app.Commands.set('eval', {
        desc: '[valid js] will return value to console',
        access: app.Config.accessLevels.owner,
        call: (to, from, text, message) => {
            try {
                let result = eval(text);
                logger.info(`Eval result:`, {
                    result: result
                });
            } catch (err) {
                logger.error('Eval command failed:', {
                    err
                });
            }
        }
    });

    return scriptInfo;
};
