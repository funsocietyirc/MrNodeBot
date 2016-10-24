'use static';
const scriptInfo = {
    name: 'jeek',
    file: 'jeek.js',
    desc: 'Is Jeek alive?',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const xray = require('x-ray')();


module.export = (app) => {
  const jeek = (to, from, text, message) => xray('http://ishealive.jeek.net', h1)((err, results) => {
      if (err) {
          app.say(to, 'Something went wrong finding out if jeek is alive')
          return;
      }
      app.say(to, `Is Jeek Alive? ${h1}`);
      resolve(_.sampleSize(results,count));
  });

  // Total Messages command
  app.Commands.set('jeek', {
      desc: 'Is Jeek Alive?',
      access: app.Config.accessLevels.identified,
      call: jeek
  });


  return scriptInfo;
};
