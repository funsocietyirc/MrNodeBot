'use strict';
const botDb = require('../../node_modules/bot/lib/db.js');
const botObj = require('../../node_modules/bot/lib/bot.js');
const botDefaults = require('../../node_modules/bot/db/defaults.json');
const chatBot = new botObj(new botDb, botDefaults);
const replaceBrPattern = new RegExp('<br>','g');

module.exports = text => new Promise((resolve, reject) => resolve(chatBot.answer(text).replace(replaceBrPattern, '')));
