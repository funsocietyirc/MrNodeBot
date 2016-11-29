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

  const evaluate = (to, from, text, message) => {
    try {
      let result = eval(text);
      logger.info(`Cval result:`, {result:result});
    } catch (err) {
      logger.error('Cval command failed:', {err});
    }
  };
  app.Commands.set('eval', {
    desc: '[valid js] will return value to console',
    access: app.Config.accessLevels.owner,
    call: evaluate
  });

  return scriptInfo;
};
