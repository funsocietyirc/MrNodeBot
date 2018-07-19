const _ = require('lodash');
const jwt = require('jsonwebtoken');
const path = require('path');
const rotate = require('winston-daily-rotate-file');
const helmet = require('helmet');
const logger = require('../lib/logger');
const Router = require('named-routes');
const favicon = require('serve-favicon');
const Express = require('express');
const winston = require('winston');
const RateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const expressWinston = require('express-winston');
const expressVue = require("express-vue");

// Default express view options
const expressVueOptions = {
    rootPath: path.join(__dirname, '../web/vue'),
    vueVersion: "2.5.16",
    // template: {
    //     html: {
    //         start: '<!DOCTYPE html><html>',
    //         end: '</html>'
    //     },
    //     body: {
    //         start: '<body>',
    //         end: '</body>'
    //     },
    //     template: {
    //         start: '<div id="app">',
    //         end: '</div>'
    //     }
    // },
    head: {
        // title: 'Hello this is a global title',
        scripts: [
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js' },
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.min.js' },
        ],
        // styles: [
        //     { style: '/assets/rendered/style.css' }
        // ]
    },
    // data: {
    //     foo: true,
    //     bar: 'yes',
    //     qux: {
    //         id: 123,
    //         baz: 'anything you wish, you can have any kind of object in the data object, it will be global and on every route'
    //     }
    // }
};

//   Web Server component:
//   Features: named-routes, favicon, file upload, jade template engine, body parser, json parser, rate limiting, simple auth
//  json web tokens
module.exports = (app) => {
    // Helper Function to return the Configuration jwt secret, or a default with a warning
    const getJwtSecret = () => {
        // Issue User Web Tokens
        let jwtSecret = null;
        if (_.isString(app.Config.express.jwt.secret) && !_.isEmpty(app.Config.express.jwt.secret)) jwtSecret = app.Config.express.jwt.secret;
        else {
            jwtSecret = 'mrnodebot';
            logger.warn('You did not set a jwt api secret in express.jwt.secret, falling back to default');
        }
        return jwtSecret;
    };

    // Create Express Server
    const webServer = Express();

    // Initialize Helmet
    webServer.use(helmet());

    // Initiate express-vue
    const finalVueOptions = _.isObject(app.Config.vueOptions) ? _.defaults(expressVueOptions, app.Config.vueOptions) :  expressVueOptions;
    const expressVueMiddleware = expressVue.init(finalVueOptions);
    webServer.use(expressVueMiddleware);

    // Hold on to HTTP Server
    const server = require('http').createServer(webServer);

    // Bind Socket.io
    const io = webServer.socketIO = require('socket.io')(server);

    // Hold on to the Logging transports
    const transports = [];

    // Push the File Logging transports
    transports.push(
        new (winston.transports.DailyRotateFile)({
            name: 'express-info-file',
            filename: 'logs/express-info.log',
            level: 'info',
        }),
        new (winston.transports.DailyRotateFile)({
            name: 'express-error-file',
            filename: 'logs/express-error.log',
            level: 'error',
        }),
    );

    // If we are in web debug mode, push the Logging to the console
    if (app.Config.bot.webDebug === true) {
        transports.push(new (winston.transports.Console)({
            name: 'express-console',
            timestamp: true,
            colorize: true,
            prettyPrint: true,
            depth: 4,
            level: app.Config.bot.webDebugLevel || 'info',
        }));
    }

    // Attach the Logger to the express Instance
    webServer.use(expressWinston.logger({
        exitOnError: false,
        transports,
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        msg: app.Config.express.forwarded ? 'HTTP {{req.method}} {{req.url}} {{req.headers[\'x-forwarded-for\'] || req.connection.remoteAddress}}' : 'HTTP {{req.method}} {{req.url}} {{req.connection.remoteAddress}}',
        expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
        colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
        // optional: allows to skip some log messages based on request and/or response
        ignoreRoute(req, res) {
            return false;
        },
    }));

    // Prevent the web server from being indexed by spiders
    if (app.Config.express.noFollow) {
        webServer.use((req, res, next) => {
            res.header('X-Robots-Tag', 'noindex, nofollow');
            next();
        });
    }

    // Set Express powered by header to MrNodeBot
    webServer.use((req, res, next) => {
        res.header('X-powered-by', 'MrNodeBot');
        next();
    });

    // Check for Simple Authentication
    // Enable this in the configuration, and set a username + password
    if (
        _.isObject(app.Config.express.simpleAuth) &&
        _.isBoolean(app.Config.express.simpleAuth.enabled) &&
        app.Config.express.simpleAuth.enabled &&
        _.isString(app.Config.express.simpleAuth.username) &&
        !_.isEmpty(app.Config.express.simpleAuth.username) &&
        _.isString(app.Config.express.simpleAuth.password) &&
        !_.isEmpty(app.Config.express.simpleAuth.password)
    ) {
        const auth = require('basic-auth');
        webServer.use((req, res, next) => {
            const credentials = auth(req);
            if (!credentials ||
                    credentials.name !== app.Config.express.simpleAuth.username ||
                    credentials.pass !== app.Config.express.simpleAuth.password
            ) {
                res.statusCode = 401;
                const realm = _.isString(app.Config.express.simpleAuth.realm) && !_.isEmpty(app.Config.express.simpleAuth.realm) ? app.Config.express.simpleAuth.realm : 'MrNodeBot';
                res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
                res.end('I\'m sorry Dave, I\'m afraid I can\'t do that');
            } else next();
        });
    }

    // Set up rate limiting for api routes
    if (!_.isUndefined(app.Config.express.rateLimit) &&
        _.isBoolean(app.Config.express.rateLimit.enabled) &&
        app.Config.express.rateLimit.enabled
    ) {
        if (app.Config.express.forwarded) webServer.enable('trust proxy');
        const rateLimiter = new RateLimit({
            windowMs: (app.Config.express.rateLimit.limitInMins || 15) * 60 * 100,
            max: app.Config.express.rateLimit.max || 100,
            delayMs: app.Config.express.rateLimit.delayMs || 0,
            headers: app.Config.express.rateLimit.headers || false,
        });
        webServer.use('/api/', rateLimiter);
    }

    // Create a router
    const router = new Router();

    // Body parser
    webServer.use(bodyParser.urlencoded({
        extended: false,
    }));

    // Json parser
    webServer.use(bodyParser.json());

    // Named Routes
    router.extendExpress(webServer);
    router.registerAppHelpers(webServer);

    // Pretty Print json
    webServer.set('json spaces', 4);

    // Set the view engine
    webServer.set('view engine', 'pug');
    webServer.set('views', `${__dirname}/views`);

    // Serve Favicon
    webServer.use(favicon(`${__dirname}/assets/favicon.ico`));

    // Static routes
    webServer.use('/assets', Express.static(`${__dirname}/assets`));
    webServer.use('/fonts', Express.static(`${__dirname}/fonts`));

    // Uploads
    webServer.use('/uploads', Express.static(`${__dirname}/uploads`));

    // Use file-upload extension
    webServer.use(fileUpload());

    // Merge query string parameters on duplicate
    webServer._router.mergeParams = true;

    webServer.post('/authenticate', (req, res) => {
        if (!req.body.nick || !req.body.password) {
            return res.json({
                success: false,
                message: 'Both nick and password are required',
            });
        }

        app._userManager.getByNick(req.body.nick, (user) => {
            // No user available
            if (!user) {
                return res.json({
                    success: false,
                    message: 'Authentication failed',
                });
            }


            // Verify user
            app._userManager.verify(user.attributes.nick, req.body.password).then((authenticated) => {
                // Password mismatch
                if (!authenticated) {
                    return res.json({
                        success: false,
                        message: 'Authentication failed',
                    });
                }

                const userInfo = {
                    nick: user.attributes.nick,
                    id: user.attributes.id,
                    email: user.attributes.email,
                    admin: _.includes(app.Admins, _.toLower(user.attributes.nick)) || user.attributes.admin,
                };

                // Generate the token
                const token = jwt.sign(userInfo, getJwtSecret(), {
                    expiresIn: 60 * 60 * 24, // Expires in 24 hours
                });

                return res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token,
                });
            })
                .catch((e) => {
                    logger.error('Something has gone wrong with user authentication', user, e.message);
                    return res.json({
                        success: false,
                        message: 'Something has gone wrong',
                    });
                });
        });
    });

    // Adds JSON web tokens to any route spawning from /secure
    webServer.use('/secure', (req, res, next) => {
        const token = req.body.token || req.query.token || req.headers['x-access-token'];

        // No token provided in Request
        if (!token) {
            return res.status(403).send({
                success: false,
                message: 'No Token Provided',
                code: 501,
            });
        }

        // Verify User
        jwt.verify(token, getJwtSecret(), (err, userInfo) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Authentication failed',
                    code: 503
                });
            }
            req.userInfo = userInfo;
            next();
        });
    });


    // If no port specifically set, find an available port
    if (!app.Config.express.port) {
        require('freeport')((err, port) => {
            if (err) {
                logger.error('Error in freeport module', {
                    err,
                });
                return;
            }
            app.Config.express.port = port;
            server.listen(port);
        });
    }
    // Bind the express server
    else server.listen(app.Config.express.port);

    // Export the Web server
    return webServer;
};
