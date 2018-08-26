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
        salt: 'samplesalt',
        keyLength: 64,
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
        nick: 'IronY',
        host: '',
    },
    // Irc Client Configuration see https://node-irc.readthedocs.io/en/latest/API.html#client
    irc: {
        nick: 'MrNodeBot',
        server: 'irc.freenode.net',
        // server: 'irc.dal.net',
        userName: 'MrNodeBot',
        realName: 'MrNodeBot',
        port: 6665,
        localAddress: null,
        debug: false,
        showErrors: true,
        autoRejoin: true,
        channels: [
            '#MrNodeBot',
        ],
        secure: false,
        selfSigned: false,
        certExpired: false,
        floodProtection: true,
        floodProtectionDelay: 500,
        sasl: false,
        retryCount: 100,
        retryDelay: 2000,
        stripColors: false,
        channelPrefixes: '&#',
        messageSplit: 512,
        encoding: 'utf8',
    },
    // Knex configuration http://knexjs.org/#Installation-client
    knex: {
        enabled: true,
        engine: 'mysql',
        mysql: {
            client: 'mysql2',
            connection: {
                host: '127.0.0.1',
                user: 'MrNodeBot',
                password: 'MrNodeBot',
                database: 'MrNodeBot',
                charset: 'utf8mb4',
            },
        },
        sqlite: {
            client: 'sqlite3',
            database: 'mrnodebot',
            connection: {
                filename: './data.sqlite',
            },
        },
    },
    // Nickserv configuration options
    nickserv: {
        password: '',
        nick: 'NickServ',
        host: '', // services.dal.net for Dalnet, empty for Freenode
        accCode: '3',
    },
    // API Keys
    apiKeys: {
        firebase: {
            apiKey: '',
            pageLinkDomain: '',
        },
        bitly: '',
        omdb: '',
        imgur: {
            clientId: '',
            clientSecret: '',
        },
        google: '',
        twitter: {
            consumerKey: '',
            consumerSecret: '',
            tokenKey: '',
            tokenSecret: '',
        },
        worldWeatherOnline: {
            key: '',
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
        port: 8084, // Bind Port
        address: 'http://127.0.0.1:8084', // Bind address
        forwarded: false, // Indiciate the site is behind a Http proxy
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
            userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
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
            // Amount of characters to limit title to, 0 or nothing for no limit
            titleMaxLimit: {
                '#mrnodebot3': 255,
            },
        },
        fsociety: {
            mainChannel: '#MrNodeBot',
            totalChannels: 0,
            report: false,
            delay: 5, // In seconds,
            additionalChannels: [
                // '#th3g3ntl3man',
            ],
            greetIgnore: ['#MrNodeBot'],
            greeterDealy: 20,
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
            updateScheduleTime: {
                hour: [...Array(24).keys()], // Every hour
                minute: 0, // On the hour
            },
        },
        weather: {},
        countdowns: [
            {
                who: 'Mr Robot Season 3',
                when: new Date(2017, 9, 11, 22, 0, 0, 0), // MomentJS
                what: [
                    'is happening in',
                    'is coming to a screen near you in',
                    'is hacking all the things in',
                    'will be brought to you in',
                    'drops in',
                    'is hacking your democracy in',
                ],
                where: 'USA Network',
                why: {
                    irc: {
                        '#mrrobot': {
                            announcements: [
                                {
                                    year: null,
                                    month: null,
                                    date: null,
                                    dayOfWeek: null,
                                    hour: 0,
                                    minute: 0,
                                    second: 0,
                                },
                            ],
                        },
                        '#fsociety': {
                            announcements: [
                                {
                                    year: null,
                                    month: null,
                                    date: null,
                                    dayOfWeek: null,
                                    hour: 0,
                                    minute: 0,
                                    second: 0,
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};
