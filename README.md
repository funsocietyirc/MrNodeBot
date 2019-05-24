![Mr. NodeBot](/web/assets/bot.png?raw=true "Mr. NodeBot")

*An IronY / FSociety Production*

[![Build Status](https://travis-ci.org/funsocietyirc/MrNodeBot.svg?branch=master)](https://travis-ci.org/funsocietyirc/MrNodeBot)
[![Dependencies](https://david-dm.org/funsocietyirc/mrnodebot.svg)](https://david-dm.org/funsocietyirc/mrnodebot)
[![devDependencies Status](https://david-dm.org/funsocietyirc/mrnodebot/dev-status.svg)](https://david-dm.org/funsocietyirc/mrnodebot?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/funsocietyirc/mrnodebot/badge.svg)](https://snyk.io/test/github/funsocietyirc/mrnodebot)

## Snyk Intergration
Since this is an IRC bot, and one cannot predict the type of character the bot may encounter in the wild, this project makes use of the Snyk vulnerabilitie
patching system. You should regularly check the snyk patching system by running ```npm run snyk-protect```.

## Special Considerations
The bot currently depends on NickServ services supporting the ACC command for certain command authentication types. Networks confirmed to work include
-   freenode
-   DALnet

## Dependencies
-   A Database engine, either MySql, MariaDB, Postgres, Sqlite3
-   node-gyp (python 2, and some sort of c build tools such as gcc or visual studio)

## Install Steps
-   Install Node Modules ```npm install```
-   Create a configuration file from a template ```cp config.sample.js config.js```
-   Edit the configuration file
-   Configure a database
    -   By default, the bot will use SQLite 3, ```npm install sqlite3```
    -   If using MySQL, ```npm install mysql2``` (Knex supports both the node-mysql and node-mysql2 flavours, with the second being faster and more secure)
        -   Create a Schema and be sure to give it a utf8mb4_unicode_ci character set (CREATE DATABASE db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
        -   Modify the config.js accordingly
        -   Once properly configured and run for the first time, the Bot will provision the database schema using migrations
-   Start the bot ```node index.js [--config config.js-path]``` or ```npm start```

## Keep the Bot Running
Included in the root directory is a sample systemd script (misc/mrnodebot.service), you can do it this way or use forever or any other node task runner.
If you want to be able to use commands like update, restart, and halt while having the Bot come back it is important you take this into consideration.

## Features
-   Logging / Analytics
-   SED Corrections
-   URL Announce
-   Popularity (upvote/downvote) system
-   Mention system
-   A Seen/Last-seen command to track usage
-   API Endpoints connected to Analytics
-   Express/Pug Web Front end
-   SocketIO connected to Express to deliver real time notifictions and bi-directional communication with the client

## Debugging
You will find various debugging flags inside the config file. These will granually conroll file based debugging options. This framework does take advantage of SocketIO and express, which
both utilize the ``Debug`` module. If you would like to see very intricate debugging for both express and socketIO, start the bot with the following command ``DEBUG=* node index.js``.

## Unit Testing
Unit testing is being introduced and has a long way to go to catch up. To run available tests ```npm test```

## Documentation
I am currently in the processes of providing jsdoc style docblocks for documentation generation. You can generate the documentation by running ```npm run generate-docs```

## Technologies
-   Query Builder / Migrations [Knex.js](http://bookshelfjs.org/)
-   ORM [Bookshelf.js](http://bookshelfjs.org/)
    -   Central Model Repository [bookshelf-model-loader](https://github.com/imjoshholloway/bookshelf-model-loader)
-   Web Server [Express.js](http://expressjs.com/en/4x/api.html)
    -   Request Body Parsing [body-parser](https://github.com/expressjs/body-parser)
    -   Wrapper for File Uploads [express-fileupload](https://github.com/pajtai/express-fileupload)
    -   API Rate Limiting [express-rate-limit](https://github.com/nfriedly/express-rate-limit)
    -   Favicon Middleware [serve-favicon](https://github.com/expressjs/serve-favicon)
    -   HTML Template language [pug](https://github.com/pugjs/pug)
    -   Route Name Helper [named-routes](https://github.com/alubbe/named-routes)
    -   Basic Authentication [basic-auth](https://github.com/jshttp/basic-auth)
-   Scheduler [node-scheduler](https://github.com/node-schedule/node-schedule)
-   Logging [Winston](https://github.com/winstonjs/winston)
    -   Log File Rotation [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)
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
    -   [socket.io](https://github.com/socketio/socket.io) Realtime application framework (Node.JS server)
    -   [bot](https://github.com/vesln/bot) Feeling lonely? You personal bot is here.
    -   [bcrypt](https://github.com/kelektiv/node.bcrypt.js) Bcrypt for Node (crypto)
    -   [twit](https://github.com/ttezel/twit) Twitter API Client for Node (REST & Streaming API)
    -   [minimist](https://github.com/substack/minimist) Parse argument options
    -   [money](http://openexchangerates.github.io/money.js/) Convert exchange rates
    -   [currency-symbol-map](https://github.com/bengourley/currency-symbol-map) A function to lookup the currency symbol for a given currency code and vice versa
    -   [accounting-js](https://github.com/nashdot/accounting-js) Number, money and currency formatting library
-   Testing
    -   [mocha](https://github.com/mochajs/mocha)
    -   [chai](https://github.com/chaijs/chai)
        -   [chai-as-promised](https://www.npmjs.com/package/chai-as-promised)
        -   [chai-moment](date assertions for chai, powered by moment)
        -   [chai-bookshelf](http://chaijs.com/plugins/chai-bookshelf/)
            [sinon-chai](https://github.com/domenic/sinon-chai)
    -   [sinon](https://github.com/sinonjs/sinon)
-   Documentation
    -   [jsdoc](https://github.com/jsdoc3/jsdoc)
    -   [docstrap](https://github.com/docstrap/docstrap)

## API Keys
-   **Firebase API Key** - The preferred URL shortner requires this (google is deprecating their other service), if not it will fall back to another option
-   **Google API Key** - For most features a *Google API key* with **SafeSearch** service, and **YouTube search** service enabled is required, however, if one is not provided, the bot will try to gracefully fall back onto is.gd
-   **Imgur API Key** - A *Imgur API key* is required to extract meta data on Imgur links in the URL announcer
-   **Twitter API Key** A *Twitter API key* is required to be able to send tweets, subscribe to tweets, or have a tweet sent out during the announce process
-   **Bitly API Key** A *Bitly API key* assists the amount of url shortners you have available to you
-   **OMDB API Key** Used in the imdb command and in the link matcher to pull info for imdb links

## URL Shortner service
The Url shortner service, found in *scripts/libs/_getShortService* will provide a url shortner based on your API key availability.
```const shortService = require('../lib/_getShortService')(DOMAIN?)```
-   DOMAIN is optional, but useful for things like avoiding googles blocking of certain domains.
-   If a firebase api key and url short domain is provided, the Firebase API will be used to shorten
-   After Firebase, if a Bitly API key is provided, Bitly will be used to shorten
-   If neither API key is available, isGd will be used to shorten (no key required, but certain pitfalls attached)

## HTTP Codes
When dealing with the API, you will find a code property on most errors.
- *501* Token not provided
- *503* Token is invalid

## Command Access Levels
-   **owner** - The Command can only be run by the bot owner (hard coded username/host combo in config.js)
-   **admin** - The Command can be run by the owner or anyone in the admin list
-   **identified** - The Command can be run by anyone using a nick identified with services
-   **guest** - The Command can be run by anyone
-   **channelOp** - The Command can be run by the owner, or anyone with ops in the channel it is being originated from
-   **channelOpIdentified** - the Command can be run by the owner, the admins, or anyone with ops in the channel who are also identified
-   **channelVoice** - the Command can be run by the owner, the the ops, and the voices in the channel it is originated from
-   **channelVoiceIdentified** - the Command can be run by identified voices, ops in the channel originated from, or owner and admins

## Magic Functions
If a script exports the following functions, they will be run at the respective run level
- **onLoad** Runs on initial load, and reload
- **unUnload** Runs during reload prior to the destruction of the require / loadedScripts cache

## Knex Migrations
This project is powered by knexjs and takes advantage of its migration system. In order to use migrations ```npm install -g knex``` and use the **knex** command, e.g. ```knex migrate:make add_users_table ```. More instructions can be found [here](http://knexjs.org/#Installation-migrations). The bot will check for and install new migrations on startup.

Have questions? Looking to chat? Join us on #fsociety on irc.freenode.net

Pull Requests Welcome

## Suggested Utils
-   [Yarn](https://yarnpkg.com/) - Fast, Reliable, and secure Dep Management
-   [Node Publish](https://www.npmjs.com/package/np) - A better NPM Publish
