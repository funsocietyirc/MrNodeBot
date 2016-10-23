'use strict';
const Express = require('express');
const Router = require('named-routes');
const favicon = require('serve-favicon');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
/*
  Web Server component:
  Features: named-routes, favicon, file upload, jade template engine, body parser
*/
module.exports = (app) => {
    let webServer = Express();
    let router = new Router();

    // Body parser
    webServer.use(bodyParser.urlencoded({
        extended: false
    }));

    // Json parser
    webServer.use(bodyParser.json());

    router.extendExpress(webServer);
    router.registerAppHelpers(webServer);

    // Set the view engine
    webServer.set('view engine', 'pug');
    webServer.set('views', __dirname + '/views');
    // Serve Favicon
    webServer.use(favicon(__dirname + '/assets/favicon.ico'));

    // Static routes
    webServer.use('/assets', Express.static(__dirname + '/assets'));

    // Uploads
    webServer.use('/uploads', Express.static(__dirname + '/uploads'));

    // Use fileupload extension
    webServer.use(fileUpload());

    // Merge query string paramaters on duplicate
    webServer._router.mergeParams = true;

    // If no port specifically set, find an available port
    if (!app.Config.express.port) {
        require('freeport')((err, port) => {
            if (err) {
                conLogger('Error in freeport module', 'error');
            }
            app.Config.express.port = port;
            websServer.listen(port);
        });
    } else {
        // Bind the express server
        webServer.listen(app.Config.express.port);
    }

    return webServer;
};
