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

-   Query Builder [Knex.js](http://bookshelfjs.org/)
-   ORM [Bookshelf.js](http://bookshelfjs.org/)
-   Web Server [Express.js](http://expressjs.com/en/4x/api.html)
-   Scheduler [node-scheduler](https://github.com/node-schedule/node-schedule)
-   IRC Client [node-irc fork](https://github.com/funsocietyirc/node-irc)
-   Logging [Winston](https://github.com/winstonjs/winston)
-   Time [Moment](http://momentjs.com/)
-   Localization [i18next](https://github.com/i18next/i18next)
-   Utility [Lodash](https://lodash.com/docs/)
-   Utility [Lodash Addons](https://github.com/helion3/lodash-addons)
-   Utility [Request](https://github.com/request/request)
-   Utility [Request-Promise](https://github.com/request/request-promise)
-   Utility [irc-colors](https://github.com/fent/irc-colors.js)

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
