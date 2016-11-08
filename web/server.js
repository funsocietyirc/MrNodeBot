'use strict';
const Express = require('express');
const Router = require('named-routes');
const favicon = require('serve-favicon');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const winston = require('winston');
const expressWinston = require('express-winston');
const rotate = require('winston-daily-rotate-file');

/*
  Web Server component:
  Features: named-routes, favicon, file upload, jade template engine, body parser, json parser
*/
module.exports = (app) => {
    // Create Express Server
    let webServer = Express();

    let transports = [];
    transports.push(new(winston.transports.DailyRotateFile)({
            name: 'express-info-file',
            filename: 'logs/express-info.log',
            level: 'info'
        }),
        new(winston.transports.DailyRotateFile)({
            name: 'express-error-file',
            filename: 'logs/express-error.log',
            level: 'error',
        }));
    if (app.Config.bot.webDebug === true) {
        transports.push(new(winston.transports.Console)({
            name: 'express-console',
            timestamp: true,
            colorize: true,
            prettyPrint: true,
            depth: 4,
            level: app.Config.bot.webDebugLevel || 'info',
        }));
    }

    webServer.use(expressWinston.logger({
        exitOnError: false,
        transports: transports,
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        msg: app.Config.express.forwarded ? "HTTP {{req.method}} {{req.url}} {{req.headers['x-forwarded-for'] || req.connection.remoteAddress}}" : "HTTP {{req.method}} {{req.url}} {{req.connection.remoteAddress}}",
        expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
        colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
        ignoreRoute: function(req, res) {
                return false;
            } // optional: allows to skip some log messages based on request and/or response
    }));

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
                logger.error('Error in freeport module', {
                    err
                });
                return;
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
