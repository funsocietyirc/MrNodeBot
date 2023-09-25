const _ = require('lodash');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet');
const Router = require('named-routes');
const favicon = require('serve-favicon');
const Express = require('express');
const winston = require('winston');
const RateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const expressWinston = require('express-winston');
const expressVue = require('express-vue');
const socketIO = require('socket.io');
const logger = require('../lib/logger');

// Default express view options
const expressVueOptions = {
    pagesPath: path.join(__dirname, '../web/vue'),
    head: {
        title: 'MrNodeBot',
        scripts: [
            { src: '/assets/external/jquery.min.js' },
        ],
    },
};

/**
 *  Check to see if the expressvu cache is stale
 * @param {Object} options
 */
const cleanExpressVueCache = (options = {}) => {
    const expressVueCacheDir = path.join(__dirname, '../.expressvue');
    const hasCache = fs.existsSync(expressVueCacheDir);

    const vueFiles = fs.readdirSync(options.pagesPath);
    const hasVueFiles = fs.existsSync(options.pagesPath);

    // There is no files
    if (!hasCache || !hasVueFiles) return;

    const vueFileMax = _(vueFiles)
        .map((f) => ({
            name: f,
            ctime: fs.statSync(path.join(options.pagesPath, f)).ctime,
        }))
        .maxBy((f) => f.ctime);

    const vueCacheFiles = fs.readdirSync(expressVueCacheDir);
    const vueCacheFileMax = _(vueCacheFiles)
        .map((f) => ({
            name: f,
            ctime: fs.statSync(path.join(expressVueCacheDir, f)).ctime,
        }))
        .maxBy((f) => f.ctime);

    if (
        // Both Dirs Have Files
        vueFileMax &&
        vueCacheFileMax &&
        // Both Files Have Times
        vueFileMax.hasOwnProperty('ctime') &&
        vueCacheFileMax.hasOwnProperty('ctime') &&
        // The source file is newer than the cache file
        vueFileMax.ctime > vueCacheFileMax.ctime
    ) {
        logger.info('The Express Vue Cache is stale, purging.');
        fs.rmdirSync(expressVueCacheDir, {
            recursive: true,
            maxRetries: 10,
        });
    }
};

//   Web Server component:
//   Features: named-routes, favicon, file upload, jade template engine, body parser, json parser, rate limiting, simple auth
//  json web tokens
module.exports = async (app) => {
    // Helper Function to return the Configuration jwt secret, or a default with a warning
    const getJwtSecret = () => {
        // Issue User Web Tokens
        let jwtSecret;
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
    if (!app.Config.bot.debug) {
        webServer.use(helmet({

        }));
    }

    // Initiate express-vue
    process.env.VUE_DEV = app.Config.bot.webDebug === true;
    const finalVueOptions = _.isObject(app.Config.vueOptions) ? _.defaults(expressVueOptions, app.Config.vueOptions) : expressVueOptions;
    await cleanExpressVueCache(finalVueOptions);
    await expressVue.use(webServer, finalVueOptions);

    // Hold on to HTTP Server
    const server = require('http').createServer(webServer);

    // Bind Socket.io
    webServer.socketIO = socketIO(server);

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
        ignoreRoute() {
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
        const rateLimiter = RateLimit({
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

    /**
     * Authenticate Handler
     * @param req
     * @param res
     * @returns {*}
     */
    const authenticateHandler = async (req, res) => {
        if (!req.body.nick || !req.body.password) {
            return res.json({
                success: false,
                message: 'Both nick and password are required',
            });
        }

        try {
            const user = await app._userManager.getByNick(req.body.nick);

            // No user available
            if (!user) {
                return res.json({
                    success: false,
                    message: 'Authentication failed',
                });
            }

            const authenticated = await app
                ._userManager.verify(user.attributes.nick, req.body.password);

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
                admin: _.includes(
                    app.Admins,
                    _.toLower(user.attributes.nick),
                ) || user.attributes.admin,
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
        } catch (err) {
            logger.error('Something has gone wrong with user authentication', {
                message: err.message || '',
                stack: err.stack || '',
            });

            return res.json({
                success: false,
                message: 'Something has gone wrong',
            });
        }
    };

    webServer.post('/authenticate', authenticateHandler);

    /**
     * Adds JSON web tokens to any route spawning from /secure
     *
     * @param req
     * @param res
     * @param next
     * @returns {*}
     */
    const secureHandler = (req, res, next) => {
        const token = req.body.token || req.query.token || req.headers['x-access-token'];

        // No token provided in Request
        if (!token) {
            return res.status(403).send({
                success: false,
                message: 'No Token Provided',
                code: 501,
            });
        }

        /**
         *  JWT Handler
         * @param err
         * @param userInfo
         * @returns {*}
         */
        const jwtHandler = (err, userInfo) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Authentication failed',
                    code: 503,
                });
            }
            req.userInfo = userInfo;
            next();
        };

        // Verify User
        jwt.verify(token, getJwtSecret(), jwtHandler);
    };

    webServer.use('/secure', secureHandler);

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
