'use strict';
const scriptInfo = {
  name: 'FML',
  desc: 'Get FML Quote',
  createdBy: 'IronY'
};
const _ = require('lodash');
const gen = require('../generators/_fmlLine');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
  app.Commands.set('fml', {
    desc: 'Get a random FML quote',
    access: app.Config.accessLevels.identified,
    call: (to, from, text, message) => gen()
      .then(result => {
        if (!result) {
          app.say(to, 'I could not seem to find any FML lines');
          return;
        }
        let output = new ircTypography.StringBuilder({
          logo: 'fml'
        });
        output.append(result[0]);
        app.say(to, output.text);
      })
      .catch(err => {
        app.say(to, 'Something went wrong with the FML API');
        logger.error('FML Command Error:', {
          err
        });
      })
  });
  return scriptInfo;
};
