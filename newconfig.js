module.exports = {
    // Project Config
    project: require('./package.json'),
    // Bot specific
    bot: {
        debug: true,
        disableScripts: false,
        // Script Directories
        scripts: [
            '/scripts/commands',
            '/scripts/admin',
            '/scripts/owner',
            '/scripts/listeners',
            '/scripts/modules',
            '/scripts/fsociety',
        ],
        // Model Directories
        models: [
            '/models'
        ],
        // Currently running Enviroment
        env: 'devel'
    },
    // Owner configuration
    owner: {
        nick: 'IronY',
        host: ''
    },
    // Irc Client Configuration see https://node-irc.readthedocs.io/en/latest/API.html#client
    irc: {
        nick: 'MrNodeBot',
        server: 'irc.freenode.net',
        userName: 'MrNodeBot',
        realName: 'MrNodeBot',
        port: 6667,
        localAddress: null,
        debug: false,
        showErrors: false,
        autoRejoin: false,
        channels: [
            '#MrNodeBot'
        ],
        secure: false,
        selfSigned: false,
        certExpired: false,
        floodProtection: false,
        floodProtectionDelay: 1000,
        sasl: false,
        retryCount: 0,
        retryDelay: 2000,
        stripColors: false,
        channelPrefixes: '&#',
        messageSplit: '512',
        encoding: 'utf8'
    },
    // Knex configuration http://knexjs.org/#Installation-client
    knex: {
        enabled: true,
        engine: 'mysql',
        mysql: {
            client: 'mysql',
            connection: {
                host: 'osiris.irony.online',
                user: 'mrnodebot',
                password: 'mrnodebot',
                database: 'mrnodebot'
            },
            sqlite: {
                client: 'sqlite3',
                connection: {
                    filename: "./mydb.sqlite"
                }
            }
        }
    },
    // Nickserv configuration options
    nickserv: {
        password: '',
        nick: 'NickServ',
        host: '',
        accCode: '3'
    },
    // API Keys
    apiKeys: {
        google: 'AIzaSyBhymtIOpbAA3aazbSwtVkFohCGVADiePM',
        mashable: 'eWKeG0B64UmshBKyCdQmnOPxIdkwp1csMISjsnUbq4CTzGAo6L',
        twitter: {
            consumerKey: '3NnCY4coWDPPyyAfMAtSemoCU',
            consumerSecret: 'dlroMbmdY5qMGmzno951OYshhQsbz6MiQiq2YkE6QcN6e6H6UF',
            tokenKey: '51793009-UfAwKQ1ggi3WxV6MAOVLa9vt9CG9QVAWnfh2HflBJ',
            tokenSecret: 'Znme5ZSpDvpKyK6zLa8KjQ81BhNCPhX6jVfNf5dy4HKHY'
        }
    },
    // Git Log configuration
    gitLog: {
        repo: __dirname,
        number: 5,
        fields: [
            'subject',
            'authorName',
            'authorDateRel',
            'abbrevHash'
        ]
    },
    // Command access levels
    accessLevels: {
        guest: 0,
        identified: 1,
        admin: 2,
        owner: 3
    },
    // Express Configuration
    express: {
        port: 1337,
        address: 'http://localhost:1337'
    },
    // Feature Configuration
    features: {
        urls: {
            googleShortIgnore: [],
            loggingIgnore: [],
            titleMin: 35,
            cacheCleanup: {
                minute: 0
            }
        },
        darkArmy: {
            mainChannel: '#fsociety',
            totalChannels: 0,
            report: false,
            delay: 5, // In seconds,
            additionalChannels: [
                // '#th3g3ntl3man',
                // '#darkarmy',
                // '##funsociety'
            ],
            greeterDealy: 20,
        },
        twitter: {
            followers: 'whoismrrobot, samesmail, mrrobotquotes',
            channels: [
                '#fsociety'
            ]
        },
        conversational: {
            enabled: false
        }
    },
};
