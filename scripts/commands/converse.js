'use strict';
const scriptInfo = {
  name: 'Converse',
  desc: 'Converse with the bot',
  createdBy: 'IronY'
};
const gen = require('../generators/_chatBotLine');

module.exports = app => {
  app.Commands.set('converse', {
    desc: '[Text?] Talk to the bot',
    access: app.Config.accessLevels.identified,
    call: (to, from, text, message) => gen(text).then(result => app.say(to, `${from}, ${result}`))
  });
  return scriptInfo;
};
