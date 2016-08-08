'use strict';
// Load in the environment variables
require('node-env-file')(__dirname + '/.env');

// Export A configuration object
module.exports = {
    // Enviroment
    env: process.env.env || 'devel',

    dbEngine: process.env.dbEngine || null,
    dbHost: process.env.dbHost || '127.0.0.1',
    dbPort: process.env.dbPort || 3389,
    dbPass: process.env.dbPass || null,
    dbUser: process.env.dbUser || null,
    dbSchema: process.env.dbSchema || null,

    // Subscribed Channels
    channels: process.env.channels.split(' ') || '#sudbury',

    // Bot Configuration
    nick: process.env.nick || 'AtlasBot',
    userName: process.env.userName || 'AtlasBot',
    realName: process.env.realName || 'Atlas NodeJs Bot Framework',
    secure: process.env.secure || false,
    localAddress: process.env.localAddress || null,
    floodProtection: process.env.floodProtection || true,
    floodProtectionDelay: process.env.floodProtectionDelay || 250,
    autoRejoin: process.env.autoRejoin || true,
    autoConnect: process.env.autoConnect || false,
    server: process.env.server || 'irc.dal.net',
    ircPort: process.env.ircPort || '', 6667,
    localAddress: process.env.localAdress || null,
    // Nick Servce configuration
    nickservNick: process.env.nickservNick || 'NickServe',
    nickservHost: process.env.nickservHost || null,
    nickservPass: process.env.nickservPass || null,
    nickservAccCode:process.env.nickservAccCode || 3,

    // API Keys
    mashableAPI: process.env.mashableAPI,
    googleAPI: process.env.googleAPI,

    // Owner Information
    ownerNick: process.env.ownerNick || 'IronY',

    // Node Config
    nodeConfig: require('./package.json'),

    // Settings for gitlog (Used in changes command)
    gitlog: {
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

    // Express Web Server Config
    expressConfig: {
        port: process.env.expressPort || false
    },

    // Debug features
    disableScripts: process.env.disableScripts || false,
    debug: process.env.debug || false,

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
    ]

};
