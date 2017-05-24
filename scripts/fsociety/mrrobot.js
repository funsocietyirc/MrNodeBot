'use strict';
const scriptInfo = {
  name: 'mrrobot',
  desc: 'Watch for quotes from the MrRobot bot, log them, clean them, and allow for announcement of them',
  createdBy: 'IronY'
};
const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
  // Do not load module if we have no database
  if (!Models.MrRobotQuotes)
    return scriptInfo;

  const quoteModel = Models.MrRobotQuotes;

  const includeExceptions = [
    'i am Mr. Robot (~mrrobot@unaffiliated/kl4200/bot/mrrobot)',
    'Error:',
    'Get a random fact from the database of weird facts',
    'I\'m now ignoring you for 5 minutes.',
    'I don\'t recognize you. You can message me either of these two commands:',
    'invalid commands within the last',
    'Quote #'
  ];

  // Schedule job
  const cronTime = new scheduler.RecurrenceRule();
  cronTime.minute = 0;
  scheduler.schedule('cleanMrRobotQuotes', cronTime, cleanQuotes);

  const cleanQuotes = async(to, from, text, message) => {
    try {
      // Get Results from database
      const results = await quoteModel.query(qb => {
        qb.where('quote', 'like', '%(1 more message)%').select(['id', 'quote']);
      }).fetchAll();

      // Verify there are results
      if (!results.length) {
        logger.info('Running MrRobot Quote clean up job, nothing to clean up...');
        return;
      }

      // Attempt to clean and merge
      for (const result of results) {
        const secondLine = await quoteModel.where('id', result.attributes.id + 1).fetch();
        const saved = await result.set('quote', `${result.get('quote').replace('(1 more message)', '')} ${secondLine.get('quote')}`).save();
        logger.info(`Cleaned up MrRobot show quotes, merged quote ${result.get('id')} and ${secondLine.get('id')}`);
        secondLine.destroy();
      }

    } catch (err) {
      // Handle exception
      logger.error('Something went wrong in the cleanQuotes function inside mrrobot.js', {
        message: err.message || '',
        stack: err.stack || ''
      });
    }
  };

  // Clean and merge quotes
  app.Commands.set('mrrobot-clean', {
    desc: 'Clean multi-line quotes',
    access: app.Config.accessLevels.owner,
    call: cleanQuotes
  });

  // Listen and Log
  app.Listeners.set('mrrobotquotes', {
    desc: 'Log quotes from #MrRobot',
    call: async(to, from, text, message) => {
      // False result
      if (!text || to !== '#MrRobot' || from !== 'MrRobot' || _.includes(includeExceptions, text) || text.split(' ').length < 3)
        return;

      // Check if the quote already exists
      try {
        const result = await quoteModel.query(qb => qb.select(['quote']).where('quote', 'like', text).limit(1)).fetch();
      } catch (err) {
        // Problem communicaiting with the Database
        logger.error(`Error getting result from DB in MrRobotQuote`, {
          message: err.message || '',
          stack: err.stack || ''
        });
        return;
      }

      // Record already exists
      if (result)
        return;

      // Attempt to save the new quote
      try {
        const record = await quoteModel.insert({quote: text});
        // Log the quote was added
        logger.info(`Added New MrRobot show quote: ${text}`);
      } catch (err) {
        // Something went wrong saving the new quote
        logger.error('Error saving result from DB in MrRobotQuote', {err});
        return;
      }
    }
  });

  // Get Quote
  app.Commands.set('mrrobot', {
    desc: '[Channel / Search Text] Mr Robot quotes powered by #MrRobot',
    access: app.Config.accessLevels.identified,
    call: async(to, from, text, message) => {
      // Decide if this is a channel or a private message
      let chan = _.first(text) === '#'
        ? _.first(text.split(' '))
        : false;

      try {
        // Fetch Result
        const result = await quoteModel.query(qb => {
          qb.select('quote').orderByRaw('rand()').limit(1);
          if (text && !chan) {
            qb.andWhere('quote', 'like', text);
          }
        }).fetch();

        // Report back
        app.say(chan || to, !result
          ? `I have not yet encountered anything like that.`
          : `${ircTypography.logos.mrrobot} ${result.get('quote')}`)

      } catch (err) {
        logger.error('Something went wrong with the mrrobot command inside mrorbot.js', {
          message: err.message || '',
          stack: err.stack || ''
        });
        app.say(chan || to, `Something went wrong fetching your quote ${from}`);
      }
    }
  });

  return scriptInfo;
};
