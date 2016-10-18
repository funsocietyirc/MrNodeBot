'use strict';

const scriptInfo = {
    name: 'Evaluate',
    file: 'eval.js',
    desc: 'Allow for inline JS Evaluation via IRC for easier debugging',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const util = require('util');
const conLogger = require('../../lib/consoleLogger.js');

module.exports = app => {

  const evaluate = (to, from, text, message) => {
    try {
      let result = eval(text);
      conLogger(`Cval result:`,'success');
      conLogger(util.inspect(result, null, 4), 'success');
    } catch (e) {
      conLogger('Cval command failed:','error');
      conLogger(util.inspect(e, null, 4), 'error');
    }
  };
  app.Commands.set('eval', {
    desc: '[valid js] will return value to console',
    access: app.Config.accessLevels.owner,
    call: evaluate
  });

  return scriptInfo;
};
