![Mr. NodeBot](/web/assets/bot.png?raw=true "Mr. NodeBot")

By: IronY

## Special Considerations
The bot currently depends on NickServ services supporting the ACC command for certain command authentication types. Networks confirmed to work include
-   freenode
-   DALnet

## Dependencies
-   A Database engine, either MySql, MariaDB, Postgres, Sqlite3
-   libicu (character encoding detection) [More Instructions](https://github.com/mooz/node-icu-charset-detector)
    -   **Debian** (Ubuntu) ```apt-get install libicu-dev```
    -   **Gentoo** ```emerge icu```
    -   **Fedora/CentOS** ```yum install libicu-devel```
    -   **macOS**
        -   Homebrew ```brew install icu4c; brew link icu4c --force```
        -   MacPorts ```port install icu +devel```

## Install Steps
-   Install Node Modules ```npm install```
-   Create a configuration file from a template ```cp config.js.sample config.js```
-   Edit the configuration file
-   Configure a database
    -   By default, the bot will use SQLite 3, ```npm install sqlite3```
    -   If using MySQL, ```npm install mysql```
        -   Create a Schema and be sure to give it a utf8mb4_unicode_ci character set (CREATE DATABASE db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
        -   Modify the config.js accordingly
        -   Once properly configured and run for the first time, the Bot will provision the database schema using migrations
-   Start the bot ```node index.js [--config config.js-path]``` or ```npm start```

## Keep the Bot Running
Included in the root directory is a sample systemd script (mrnodebot.service), you can do it this way or use forever or any other node task runner.
If you want to be able to use commands like update, restart, and halt while having the Bot come back it is important you take this into consideration.

## Features
-   Logging / Analytics
-   SED Corrections
-   URL Announce

## Technologies
-   Query Builder / Migrations [Knex.js](http://bookshelfjs.org/)
-   ORM [Bookshelf.js](http://bookshelfjs.org/)
    -   Central Model Repository [bookshelf-model-loader](https://github.com/imjoshholloway/bookshelf-model-loader)
    -   Common Model Methods [bookshelf-modelbase](https://github.com/bsiddiqui/bookshelf-modelbase)
-   Web Server [Express.js](http://expressjs.com/en/4x/api.html)
    -   Request Body Parsing [body-parser](https://github.com/expressjs/body-parser)
    -   Wrapper for File Uploads [express-fileupload](https://github.com/pajtai/express-fileupload)
    -   API Rate Limiting [express-rate-limit](https://github.com/nfriedly/express-rate-limit)
    -   Favicon Middleware [serve-favicon](https://github.com/expressjs/serve-favicon)
    -   HTML Template language [pug](https://github.com/pugjs/pug)
    -   Route Name Helper [named-routes](https://github.com/alubbe/named-routes)
-   Scheduler [node-scheduler](https://github.com/node-schedule/node-schedule)
-   Logging [Winston](https://github.com/winstonjs/winston)
    -   Log File Rotation [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)
    -   Real-Time Logging via HTTP [winston-logio-mirror](https://github.com/jaakkos/winston-logio)
    -   Express Web Server Request Logging [express-winston](https://github.com/bithavoc/express-winston)
-   Time [Moment](http://momentjs.com/)
-   Localization [i18next](https://github.com/i18next/i18next)
    -   File System Loader [i18next-sync-fs-backend](https://github.com/i18next/i18next-node-fs-backend)
-   Functional [Lodash](https://lodash.com/docs/)
    -   Additional Convenience Methods [Lodash Addons](https://github.com/helion3/lodash-addons)
-   HTTP Request [Request](https://github.com/request/request)
    -   Native Promise Implementation [Request-Promise](https://github.com/request/request-promise)
-   IRC [node-irc fork](https://github.com/funsocietyirc/node-irc)
-   Utilities
    -   [file-type](https://github.com/sindresorhus/file-type) Detect the file type by checking the magic number of a Buffer/Uint8Array
    -   [irc-colors](https://github.com/fent/irc-colors.js) IRC Colors
    -   [freeport](https://github.com/daaku/nodejs-freeport) Get an available open port on current host
    -   [gitlog](https://github.com/domharrington/node-gitlog) Git log parser
    -   [rand-token](https://www.npmjs.com/package/rand-token) Generate random tokens
    -   [rand-js](https://github.com/ckknight/random-js) A mathematically correct random number generator library for JavaScript
    -   [URIjs](https://github.com/medialize/URI.js) Javascript URL mutation library
    -   [shelljs](https://github.com/shelljs/shelljs) Portable Unix shell commands
    -   [x-ray](https://github.com/lapwinglabs/x-ray) The next web scraper
    -   [hashmap](https://github.com/flesler/hashmap) HashMap JavaScript class for NodeJS and the browser. The keys can be anything and won't be stringified
    -   [pusher](https://github.com/pusher/pusher-http-node) Node.js client to interact with the Pusher REST API
    -   [bot](https://github.com/vesln/bot) Feeling lonely? You personal bot is here.
    -   [scrypt](https://github.com/barrysteyn/node-scrypt) Scrypt for Node (crypto)
    -   [watson-developer-cloud](https://github.com/watson-developer-cloud/node-sdk) Node.js library to access IBM Watson services.
    -   [twit](https://github.com/ttezel/twit) Twitter API Client for Node (REST & Streaming API)
    -   [minimist](https://github.com/substack/minimist) Parse argument options
    -   [money](http://openexchangerates.github.io/money.js/) Convert exchange rates
    -   [currency-symbol-map](https://github.com/bengourley/currency-symbol-map) A function to lookup the currency symbol for a given currency code and vice versa
    -   [accounting-js](https://github.com/nashdot/accounting-js) Number, money and currency formatting library
-   Testing
    -   [mocha]()
    -   [chai](https://github.com/chaijs/chai)
    -   [chai-as-promised](https://www.npmjs.com/package/chai-as-promised)
    -   [chai-moment](date assertions for chai, powered by moment)

## API Keys
-   For most features a Google API key with Shortener service, SafeSearch service, and YouTube search service enabled is required, however, if one is not provided, the bot will try to gracefully fall back onto is.gd

## Command Access Levels
-   **owner** - The Command can only be run by the bot owner (hard coded username/host combo in config.js)
-   **admin** - The Command can be run by the owner or anyone in the admin list
-   **identified** - The Command can be run by anyone using a nick identified with services
-   **guest** - The Command can be run by anyone
-   **channelOp** - The Command can be run by the owner, or anyone with ops in the channel it is being originated from
-   **channelOpIdentified** - the Command can be run by the owner, the admins, or anyone with ops in the channel who are also identified
-   **channelVoice** - the Command can be run by the owner, the the ops, and the voices in the channel it is originated from
-   **channelVoiceIdentified** - the Command can be run by identified voices, ops in the channel originated from, or owner and admins

## Knex Migrations
This project is powered by knexjs and takes advantage of its migration system. In order to use migrations ```npm install -g knex``` and use the **knex** command, e.g. ```knex migrate:make add_users_table ```. More instructions can be found [here](http://knexjs.org/#Installation-migrations). The bot will check for and install new migrations on startup.

Have questions? Looking to chat? Join us on #fsociety on irc.freenode.net

Pull Requests Welcome
