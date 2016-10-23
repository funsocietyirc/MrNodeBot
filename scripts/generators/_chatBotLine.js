'use strict';
const botObj = require('../../node_modules/bot/lib/bot.js');
const botDb = require('../../node_modules/bot/lib/db.js');
const botDefaults = require('../../node_modules/bot/db/defaults.json');
const chatBot = new botObj(new botDb, botDefaults);

module.exports = text => new Promise((resolve, reject) => resolve(chatBot.answer(text).replaceAll('<br>', '')));
