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
    const showerThought = async (to, from, text, message) => {
      try {
          const result = await gen();
          app.say(to, !result ?
              'I could not seem to find any Shower Thoughts' :
              `Shower Thought ${ircTypography.icons.sideArrow} ${_.first(result)}`
          );
      }
      catch (err) {
          logger.error('Shower Thoughts Error', {
              message: err.message || '',
              stack: err.stack ||'',
          });
          app.say(to, 'Something went wrong with the Reddit API');
      }
    };

    app.Commands.set('shower-thought', {
        desc: 'Get a random Shower thought',
        access: app.Config.accessLevels.identified,
        call: showerThought
    });

    return scriptInfo;
};
