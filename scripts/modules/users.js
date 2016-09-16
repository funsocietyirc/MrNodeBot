'use strict';
module.exports = app => {
  // Register a User
  const register  = (to,from,text,message) => {
    let args = text.split(' ');
    if(!args[0]) {
      app.say(from, 'A Email is required');
      return;
    }
    if(!args[1]) {
      app.say(from, 'A Password is required');
      return;
    }
    app._userManager.create(from, args[0], args[1], message.host).then(result => {
      app.say(from, 'Your account has been created');
    }).catch( err => {
      app.say(from, 'Something went wrong creating your account, the username may exist');
    });
  };

  app.Commands.set('register', {
      desc: '[email] [password] - Register your nick',
      access: app.Config.accessLevels.guest,
      call: register
  });
};
