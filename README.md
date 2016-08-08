# PipBoy9000
## Install Steps
- npm install
- cp mv sample.env to .env
- get mashape api key from [https://market.mashape.com](https://market.mashape.com)
- fill in .env file
- node app.js will run a daemon that will relaunch if the bot crashes
- node index.js will run the bot without daemon and allow for better debugging

## To daemonize I recommend using the Forever NPM package
### Due to this bot requiring NickServ for its validation of access levels
### It has been tested with both FreeNode and Dalnet
