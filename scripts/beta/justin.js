'use strict';
const scriptInfo = {
    name: 'justin',
    file: 'justin.js',
    createdBy: 'Dave Richer'
};


module.exports = app => {
  const justin = (to, from, text, message) => {
    app.say(to, 'Justin Likes little boys');
  };
  app.Commands.set('justin', {
      desc: 'justin',
      access: app.Config.accessLevels.owner,
      call: justin
  });

    // Return the script info
    return scriptInfo;
};
