'use strict';
module.exports = app => {
  const isInChannel  = (to,from,text,message) => {
    app._ircClient.isOp(to,from);
    if(app._ircClient.isOp(to,from)) {
      app.say(to, 'is an op');
    } else {
      app.say(to, 'is not an op');
    }
  };
  app.Commands.set('test-topic', {
      desc: '',
      access: app.Config.accessLevels.owner,
      call: isInChannel
  });
};
