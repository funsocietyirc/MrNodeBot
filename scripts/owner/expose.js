'use strict';
const scriptInfo = {
    name: 'Expose',
    desc: 'Open a web server and advertise it in a channel for a specified period of time. ' +
          'Any IRC client that is auto pulling websites will get their IP posted back',
    createdBy: 'Dave Richer'
};

const randToken = require('rand-token');
const HashMap = require('hashmap');

module.exports = app => {
  const tokens = new HashMap();

  // Register Route with Application
  const exposeRoute = (req, res) => {
    let token = req.params.token;
    let ip =  req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if(!tokens.has(token) || !ip) {
      res.status(503).send({status:503, message: 'unauthorized', type:'unauthorized'});
      return;
    }
    app.say(tokens.get(token), `${ip} is currently logging this channel.`);
    res.status(404).send({status:404, message: 'Not Found', type:'notfound'});
    return;
  };
  app.WebRoutes.set('expose', {
      handler: exposeRoute,
      desc: 'Image Front End',
      path: '/expose/:token',
      name: 'expose'
  });

  const expose = (to, from, text, message) => {
    if (tokens.search(to)) {
      app.say(from, `${to} is already exposed`);
      return;
    }
    let token = ''
    do {
      token = randToken.generate(8);
    } while(tokens.has(token));
    tokens.set(token, to);
    let path = app.WebServer.namedRoutes.build('expose', {token:token});
    let url = `${app.Config.express.address}${path}`;
    app.say(to,`-- Do not click this link if you do not wish to be Exposed -- ${app.nick} ${url}`);
    setTimeout(() => {
      tokens.remove(token);
      app.say(from, `Expose is no longer listening on ${to}.`);
    },60000);

  };
  app.Commands.set('expose', {
      desc: 'See who is listening to your channel via a link callback',
      access: app.Config.accessLevels.owner,
      call: expose
  });
};
