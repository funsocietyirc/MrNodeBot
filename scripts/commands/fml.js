'use strict';
const scriptInfo = {
  name: 'FML',
  file: 'fml.js',
  desc: 'Get FML Quote',
  createdBy: 'Dave Richer'
};

const _ = require('lodash');
const ircTypography = require('../../lib/ircTypography');

const xray = require('x-ray')();

module.exports = app => {
  const fml = (to, from, text, message) => {
    xray('http://www.fmylife.com/random', ['a.fmllink'])((err, results) => {
        if (err || !results || _.isEmpty(results)) {
            app.say(to, 'Something went wrong with the FML API');
            if(err) {
              console.log('FML Command Error:');
              console.dir(err);
            }
            return;
        }
        app.say(to, `${ircTypography.logos.fml} ${_.sample(results)}`);
    });
  };
  app.Commands.set('fml', {
      desc: 'Get a random FML quote',
      access: app.Config.accessLevels.identified,
      call: fml
  });
  return app;
}
