![Mr. NodeBot](/web/assets/bot.png?raw=true "Mr. NodeBot")

By: IronY

# Deps

-   Mysql || MariaDB || Postgres SQL || Sqlite3
-   libiconv

# Features

-   Logging / Analytics
-   SED Corrections
-   URL Announce

# Technologies

-   Query Builder / Migrations [Knex.js](http://bookshelfjs.org/)
-   ORM [Bookshelf.js](http://bookshelfjs.org/)
    -   Central Model Repository [bookshelf-model-loader](https://github.com/imjoshholloway/bookshelf-model-loader)
    -   Common Model Methods [bookshelf-modelbase](https://github.com/bsiddiqui/bookshelf-modelbase)
-   Web Server [Express.js](http://expressjs.com/en/4x/api.html)
    -   Request body parsing [body-parser](https://github.com/expressjs/body-parser)
    -   Wrapper for File Uploads [express-fileupload](https://github.com/pajtai/express-fileupload)
    -   API Rate Limiting [express-rate-limit](https://github.com/nfriedly/express-rate-limit)
    -   Favicon Middleware [serve-favicon](https://github.com/expressjs/serve-favicon)
    -   HTML Template language [pug](https://github.com/pugjs/pug)
    -   Route name helper [named-routes](https://github.com/alubbe/named-routes)
-   Scheduler [node-scheduler](https://github.com/node-schedule/node-schedule)
-   IRC Client [node-irc fork](https://github.com/funsocietyirc/node-irc)
-   Logging [Winston](https://github.com/winstonjs/winston)
    -   Log File Rotation [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)
    -   Real Time Logging via HTTP [winston-logio-mirror](https://github.com/jaakkos/winston-logio)
    -   Express web server request logging [express-winston](https://github.com/bithavoc/express-winston)
-   Time [Moment](http://momentjs.com/)
-   Localization [i18next](https://github.com/i18next/i18next)
    -   File System loader [i18next-sync-fs-backend](https://github.com/i18next/i18next-node-fs-backend)
-   Utility - Functional [Lodash](https://lodash.com/docs/)
    -   additional convienance methods [Lodash Addons](https://github.com/helion3/lodash-addons)
-   Utility - HTTP Request [Request](https://github.com/request/request)
    -   Native promise implementation [Request-Promise](https://github.com/request/request-promise)
-   Utility - IRC [irc-colors](https://github.com/fent/irc-colors.js)

# API Keys
-   For most features a Google API key with Shortener service, SafeSearch service, and YoutTube search service enable is required, how ever if one is not provided,
| the bot will try to gracefully fall back onto is.gd


# Install Steps

-   ```npm install```
-   ```cp config.js.sample config.js```
-   go through configuration and adjust
-   By default the bot will use sqlite3, you will need to ```npm install sqlite3``` in order for this to work
-   If instead you decide to use mysql, ```npm install mysql```
-   ```node index.js [--config config.js-path]``` or ```npm start```

## Due to this bot requiring NickServ for its validation of access levels

## It has been tested with both FreeNode and Dalnet

Have questions? Looking to chat? Join us on #fsociety on irc.freenode.net

Pull Requests Welcome

## If using mysql you will need to create a schema first, make sure to give it a utf8mb4_unicode_ci charset
CREATE DATABASE db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
