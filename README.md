![Mr. NodeBot](https://cdn.irony.online/bot.png)

By: IronY

# Deps

-   Mysql || MariaDB || Postgres SQL || Sqlite3
-   libiconv

# Technologies

-   Knex.js
-   Bookshelf.js
-   Lodash
-   Express
-   node-scheduler
-   node-irc

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
