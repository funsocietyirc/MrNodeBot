'use strict';

module.exports = app => {
  const echo = (to, from, text, message) => {
      app.Bot.say(to, text);
  };

  // Echo Test command
  app.Commands.set('echo', {
      desc: 'Exactly what it sounds like',
      access: app.Config.accessLevels.identified,
      call: echo
  });
};
