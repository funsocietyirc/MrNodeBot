// This file has been modified to depend upon a .env file
// and to run in a Docker container with compose.yml

module.exports = {
    // Project Config
    project: require('./package.json'),
    // Bot specific
    bot: {
        // trigger: '`', // Uncomment and set to specify custom trigger, defaults to bots nick
        // triggerSpace: false, // Require a space after the trigger
        debug: true,
        debugLevel: 'info',
        webDebug: true,
        webDebugLevel: 'info',
        disableScripts: false,
        // Effects SSL on Requests
        strictTLS: false,
        // Script Directories
        scripts: [
            // Core Libs
            '/scripts/lib',
            // Data Generators (Promises)
            '/scripts/generators',
            // Express end points
            '/scripts/pages',
            // Single Point commands
            '/scripts/commands',
            // Administrative commands
            '/scripts/admin',
            // Owner commands
            '/scripts/owner',
            // Listeners
            '/scripts/listeners',
            // Scripts that have mix of everything
            '/scripts/modules',
            // Fsociety Module -- For #fsociety on Freenode
            // '/scripts/fsociety',
            // URL Listener feature
            '/scripts/urlListener',
            // Covid19
            '/scripts/covid19',
            // Only load in development
            // '/scripts/beta',
        ],
        // Model Directories
        models: [
            'models',
        ],
        // Currently running Environment
        env: 'devel',
    },
    // Localization setting
    localization: {
        debug: false,
        lng: 'en',
        defaultNS: 'app',
        fallbackLng: 'en',
        initImmediate: false,
        whitelist: ['en'],
        saveMissing: true,
        saveMissingTo: 'current',
        ns: ['app', 'libraries'],
        preload: ['en'],
        load: 'current',
    },
    // User Manager configuration
    userManager: {
        salt: process.env.USER_MANAGER_SALT,
        keyLength: 64, // Legacy scrypt key length; bcryptjs must not use this as cost rounds.
        bcryptRounds: Number.parseInt(process.env.USER_MANAGER_BCRYPT_ROUNDS, 10) || 10,
    },
    // Socket IO Configuration
    socketIO: {
        logging: true,
    },
    // Command aliasinging
    commandBindings: [{
        command: 'update',
        alias: 'upgrayeddd',
    }, {
        command: 'reload',
        alias: 'refresh',
    }, {
        command: 'token',
        alias: 'upload-token',
    }],
    // Owner configuration
    owner: {
        nick: process.env.OWNER_NICK,
        host: '',
    },
    // Irc Client Configuration see https://node-irc.readthedocs.io/en/latest/API.html#client
    irc: {
        nick: 'MrNodeBot',
        server: 'irc.libera.chat',
        // server: 'irc.dal.net',
        userName: 'MrNodeBot',
        realName: 'MrNodeBot',
        port: 6697,
        localAddress: null,
        password: process.env.NICKSERV_PASSWORD,
        debug: true,
        showErrors: true,
        autoRejoin: true,
        channels: [
            //'#fsociety',
            '#MrNodeBot'
        ],
        secure: true,
        selfSigned: false,
        certExpired: false,
        floodProtection: true,
        floodProtectionDelay: 500,
        sasl: false, //true,
        retryCount: 100,
        retryDelay: 2000,
        stripColors: false,
        channelPrefixes: '#', //'&#',
        messageSplit: 512,
        encoding: 'utf8',
    },
    // Knex configuration http://knexjs.org/#Installation-client
    knex: {
        enabled: true,
        engine: 'mysql',
        sqlite: {
            client: 'sqlite3',
            database: 'mrnodebot',
            connection: {
                filename: './data/data.sqlite',
            },
        },
        mysql: {
            client: 'mysql2',
            connection: {
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
                charset: 'utf8mb4',
            },
        },
        mssql: {
            client: 'mssql',
            connection: {
                server: process.env.MSSQL_SERVER,
                port: process.env.MSSQL_PORT,
                user: process.env.MSSQL_USER,
                password: process.env.MSSQL_PASSWORD,
                database: process.env.MSSQL_DATABASE,
            }
        },
    },
    // pusher: {
    //     enabled: true,
    //     config: {
    //         appId: process.env.PUSHER_APPID, // This comes from https://dashboard.pusher.com/
    //         key: process.env.PUSHER_KEY,
    //         secret: process.env.PUSHER_SECRET
    //     }
    // },
    // Nickserv configuration options
    nickserv: {
        password: process.env.NICKSERV_PASSWORD,
        nick: 'NickServ',
        host: '', // services.dal.net for Dalnet, empty for Freenode
        accCode: '3',
        authType: 'acc', // either 'status' or 'acc', status for Freenode, acc for libera
    },
    // API Keys
    apiKeys: {
        firebase: {
            apiKey: process.env.FIREBASE_API_KEY,
            pageLinkDomain: process.env.FIREBASE_DOMAIN,
        },
        bitly: '',
        omdb: '',
        imgur: {
            clientId: process.env.IMGUR_CLIENT_ID,
            clientSecret: process.env.IMGUR_CLIENT_SECRET,
        },
        google: process.env.GOOGLE_API_KEY, // If this isn't filled in, the url catcher will not function. Comes from https://console.developers.google.com/apis/credentials
        twitter: {
            enabled: process.env.TWITTER_ENABLED,
            consumerKey: process.env.TWITTER_CONSUMER_KEY,  // Fill these in from https://apps.twitter.com/
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            tokenKey: process.env.TWITTER_TOKEN_KEY,
            tokenSecret: process.env.TWITTER_TOKEN_SECRET
        },
    },
    // Git Log configuration
    gitLog: {
        repo: __dirname,
        number: 5,
        fields: [
            'subject',
            'authorName',
            'authorDateRel',
            'abbrevHash',
        ],
    },
    // Command access levels
    accessLevels: {
        guest: 0,
        identified: 1,
        admin: 2,
        owner: 3,
        channelOp: 4,
        channelVoice: 5,
        channelOpIdentified: 6,
        channelVoiceIdentified: 7,
    },
    // Express Configuration
    express: {
        port: process.env.PORT, //8084, // Bind Port
        address: process.env.BIND_URL, //'http://127.0.0.1:8084', // Bind address
        // https://stackoverflow.com/questions/15771805/how-to-set-socket-io-origins-to-restrict-connections-to-one-url/21711242#21711242
        allowedOrigins: 'https://tzirc.com:*',
        forwarded: true, // Indiciate the site is behind a Http proxy
        noFollow: true, // Prevent the express routes from being indexed by spiders
        // Rate limiter for routes in the /api/ uir space
        rateLimit: {
            enabled: true,
            limitInMins: 15, // The amount of mins for the rate limiter
            max: 100, // The Max amount of requests
            delayMs: 0, // The delay in ms (0 to indicate no delay until max)
            headers: true, // Inject HTTP headers to show usage remaining
        },
        // Enable Simple Authentication
        simpleAuth: {
            enabled: false,
            realm: '',
            username: '',
            password: '',
        },
        jwt: {
            secret: 'mrnodebot',
        },

    },
    // Feature Configuration
    features: {
        messenger: {
            enabled: false,
            pageId: '',
            accessToken: '',
            appId: '',
            appSecret: '',
            verifyToken: '',
        },
        webLogs: [
            // '#mrnodebot'
        ],
        seen: {
            recursionLimit: 5,
            allowRecursion: true,
        },
        watchYoutube: {
            enabled: true,
        },
        voiceRegulars: {
            // Auto voice anyone who comes into the channel, or at a specified time interval
            autoVoice: true,
            autoVoiceTimeInMins: 40,
            autoVoiceChannelIgnore: [],
            // Message threshold: used in both auto voice and manual voiceRegulars
            threshold: 250,
        },
        sed: {
            totalDbResults: 50,
            triggerStart: 's',
            delimiter: '/',
            ignoredChannels: [],
        },
        popularity: {
            delayInMins: 30,
            cleanJobInMins: 30,
            ignoredChannels: [],
        },
        urls: {
            // Given User Agent
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', // Updated 6/10/2026. This being stale can hurt YouTube resolution.
            // Maximum Content Length
            maxLength: 10485760,
            // IRC channels to ignore logging from
            loggingIgnore: [],
            // IRC channels to ignore announcements from
            announceIgnore: [],
            // IRC channels to ignore unverified announces from
            unverifiedIgnore: [],
            // Default title announce max characters,
            defaultTitleAnnounceMax: 255,
            // Scheduler object for cache clean up
            cacheCleanup: {
                minute: 0,
            },
            // Amount of URLS per line, 0 or nothing for no limit
            chainingLimit: {
                '#mrnodebot3': 2,
            },
            // Amount of times to announce to channel, 0 or nothing for no limit
            repostLimit: {
                '#mrnodebot3': 2,
            },
            // Head whitelist, anything here will not require a pre-flight head request for URL matching
            // use host format, eg: 'news.ycombinator.com'
            headWhitelist: [
            ],
            // Amount of characters to limit title to, 0 or nothing for no limit
            titleMaxLimit: {
                '#mrnodebot3': 255,
            },
            // Channel Diversions
            diversions: [
                // {
                //     source: '#coronavirus',
                //     dest: '#coronavirus-links'
                // }
            ],
            twitter: [
                // {
                //     channel: '#mrnodebot2',
                //     hashtags: ['#test'],
                // }
            ],
        },
        fsociety: {
            mainChannel: '#fsociety',
            totalChannels: 0,
            report: false,
            delay: 5, // In seconds,
            additionalChannels: [
                "#mrrobot",
                "#MrNodeBot"
                // '#th3g3ntl3man',
            ],
            greetIgnore: ['#MrNodeBot'],
            greeterDelay: 20,
        },
        idleChat: {
            enabled: false,
            timeOutInMins: 180,
            channels: ['#MrNodeBot'],
        },
        twitter: {
            enabled: false,
        },
        conversational: {
            randomChance: 5000,
            enabled: false,
            ignoredChans: [],
        },
        exchangeRate: {
            apiKey: '', // obtain a free API key from fixer.io
            coinMarketCapApiKey: '',
            updateScheduleTime: {
                hour: [...Array(24).keys()], // Every hour
                minute: 0, // On the hour
            },
        },
        weather: {},
        countdowns: [
            //{
            //    who: 'Mr Robot Season 3',
            //    when: new Date(2017, 9, 11, 22, 0, 0, 0), // MomentJS
            //    what: [
            //        'is happening in',
            //        'is coming to a screen near you in',
            //        'is hacking all the things in',
            //        'will be brought to you in',
            //        'drops in',
            //        'is hacking your democracy in',
            //    ],
            //    where: 'USA Network',
            //    why: {
            //        irc: {
            //            '#mrrobot': {
            //                announcements: [
            //                    {
            //                        year: null,
            //                        month: null,
            //                        date: null,
            //                        dayOfWeek: null,
            //                        hour: 0,
            //                        minute: 0,
            //                        second: 0,
            //                    },
            //                ],
            //            },
            //            '#fsociety': {
            //                announcements: [
            //                    {
            //                        year: null,
            //                        month: null,
            //                        date: null,
            //                        dayOfWeek: null,
            //                        hour: 0,
            //                        minute: 0,
            //                        second: 0,
            //                    },
            //                ],
            //            },
            //        },
            //    },
            //},
        ],
    },
};
