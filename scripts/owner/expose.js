'use strict';
const scriptInfo = {
    name: 'rename',
    file: 'rename.js',
    createdBy: 'Dave Richer'
};

module.exports = app => {
  // Register Route with Application
  const exposeRoute = (req, res) => {
    let ip =  req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let channel = req.params.channel;
    if(!ip || !channel) {
      return;
    }
    app.say(channel, `${ip} is currently logging this channel.`);
  };
  app.WebRoutes.set('expose', {
      handler: exposeRoute,
      desc: 'Image Front End',
      path: '/expose/:channel',
      name: 'expose'
  });

  const expose = (to, from, text, message) => {
    let path = app.WebServer.namedRoutes.build('expose', {channel: to});
    let url = `${app.Config.express.address}${path}`;
    app.say(to,`Are you listening God?, it is me ${app.nick} ${url} -- Do not click this link if you do not wish to be Exposed`);
  }
  app.Commands.set('expose', {
      desc: 'See who is listening to your channel via a link callback',
      access: app.Config.accessLevels.owner,
      call: expose
  });
};
