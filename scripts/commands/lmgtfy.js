'use strict';
const scriptInfo = {
  name: 'Let me google that for you',
  file: 'lmgtfy.js',
  desc: 'Grab a let me google that for you link',
  createdBy: 'Dave Richer'
};

const rp = require('request-promise-native');
const ircTypography = require('../../lib/ircTypography');
const apiKey = require('../../config').apiKeys.google;

const baseUrl = 'http://lmgtfy.com/?q=';


module.exports = app => {
  const lmgtfy = (to, from, text, message) => {
      if(!text) {
        app.say(to, 'You need to give me some more information...');
        return;
      }
      rp({
        uri: `https://is.gd/create.php`,
        method: 'GET',
        json: true,
        qs: {
          format: 'json',
          url: baseUrl + encodeURIComponent(text)
        }
      })
      .then(result => {
        if(!result.shorturl) {
          app.say(to, 'Something went wrong figuring that out for you');
          return;
        }
        app.say(to, `${ircTypography.logos.lmgtfy} ${result.shorturl}`);
      })
      .catch(err => {
        console.log('LMGTFY Error');
        console.dir(err);
      });
  };

  app.Commands.set('lmgtfy', {
      desc: '[search text] - Figure something out for someone',
      access: app.Config.accessLevels.identified,
      call: lmgtfy
  });

  return scriptInfo;
};
