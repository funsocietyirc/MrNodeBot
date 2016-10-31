'use strict';
const scriptInfo = {
  name: 'Shower Thoughts',
  desc: 'Get a REDDIT shower thought',
  createdBy: 'Dave Richer'
};

const _ = require('lodash');
const gen = require('../generators/_showerThoughts');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
  const showerThought = (to, from, text, message) => {
  gen()
    .then(result => {
      if(!result) {
        app.say(to, 'I could not seem to find any Shower Thoughts');
        return;
      }
      app.say(to, `Shower Thought ${ircTypography.icons.sideArrow} ${_.first(result)}`);
    })
    .catch(err => {
      app.say(to,'Something went wrong with the Reddit API');
      console.log('Shower Thought Command Error:');
      console.dir(err);
    })

  };

  app.Commands.set('shower-thought', {
      desc: 'Get a random Shower thought',
      access: app.Config.accessLevels.identified,
      call: showerThought
  });

  return scriptInfo;
};
