'use strict';
const scriptInfo = {
  name: 'Let me google that for you',
  desc: 'Grab a let me google that for you link',
  createdBy: 'IronY'
};
const gen = require('../lib/_getShortService');
const logger = require('../../lib/logger');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
  app.Commands.set('lmgtfy', {
    desc: '[search text] - Figure something out for someone',
    access: app.Config.accessLevels.identified,
    call: (to, from, text, message) => {
      if (!text) {
        app.say(to, 'You need to give me some more information...');
        return;
      }
      gen('http://lmgtfy.com/?q=' + encodeURIComponent(text))
        .then(result =>
          app.say(to, !result ?
            'Something went wrong figuring that out for you' :
            `${ircTypography.logos.lmgtfy} ${result}`)
        )
        .catch(err => logger.error('LMGTFY Error', {
          err
        }));
    }
  });
  return scriptInfo;
};
