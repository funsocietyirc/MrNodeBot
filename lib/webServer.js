'use strict';
const Express = require('express');
const Router = require('named-routes');
const favicon = require('serve-favicon');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

/*
  Web Server compontent:
  Features: named-routes, favicon, fileupload, jade template engine, body parser
*/
module.exports = app => {
  let webServer = Express();
  let router = new Router();

  router.extendExpress(webServer);
  router.registerAppHelpers(webServer);

  // Set the view engine
  webServer.set('view engine', 'pug');

  // Serve Favicon
  webServer.use(favicon(__dirname + '/../assets/favicon.ico'));

  // Body parser
  webServer.use(bodyParser.urlencoded({ extended: false }));

  // Static routes
  webServer.use('/assets', Express.static('assets'));

  // Uploads
  webServer.use('/uploads', Express.static('uploads'));

  // Use fileupload extension
  webServer.use(fileUpload());

  // Merge query string paramaters on duplicate
  webServer._router.mergeParams = true;

  // If no port specifically set, find an available port
  if (!app.Config.expressConfig.port) {
      require('freeport')((err, port) => {
          if (err) {
              conLogger('Error in freeport module', 'error');
          };
          app.Config.expressConfig.port = port;
          websServer.listen(port);
      });
  } else {
      // Bind the express server
      webServer.listen(app.Config.expressConfig.port);
  }

  return webServer;
};
