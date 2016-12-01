'use strict';
const scriptInfo = {
  name: 'Shower Thoughts',
  desc: 'Get a REDDIT shower thought',
  createdBy: 'IronY'
};

const _ = require('lodash');
const gen = require('../generators/_showerThoughts');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
  app.Commands.set('shower-thought', {
      desc: 'Get a random Shower thought',
      access: app.Config.accessLevels.identified,
      call: (to, from, text, message) => gen()
        .then(result => {
          if(!result) {
            app.say(to, 'I could not seem to find any Shower Thoughts');
            return;
          }
          app.say(to, `Shower Thought ${ircTypography.icons.sideArrow} ${_.first(result)}`);
        })
        .catch(err => {
          app.say(to,'Something went wrong with the Reddit API');
          logger.error('Shower Thoughts Error', {err});
        })
  });
  return scriptInfo;
};
