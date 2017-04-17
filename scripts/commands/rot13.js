'use strict';
const scriptInfo = {
  name: 'rot13',
  desc: 'Rot 13 Encoder',
  createdBy: 'IronY'
};
const _ = require('lodash');
const helpers = require('../../helpers');

module.exports = app => {
  app.Commands.set('rot13', {
    desc: '[text] Encode a rot13 string',
    access: app.Config.accessLevels.admin,
    call: (to, from, text, message) => app.say(to, (!_.isString(text) || _.isEmpty(text)) ? `I need something to encode ${from}` : app.say(to, helpers.Rot13(text)))
  });

  // Return the script info
  return scriptInfo;
};
