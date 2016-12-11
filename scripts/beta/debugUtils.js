'use strict';

const scriptInfo = {
    name: 'Debug Utils',
    desc: 'Bot Debugging',
    createdBy: 'IronY'
};

const _ = require('lodash');
const logger = require('../../lib/logger.js');

module.exports = app => {
    // Evaluate
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
