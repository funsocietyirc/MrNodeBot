'use strict';
const scriptInfo = {
    name: 'mrrobot',
    desc: 'Watch for quotes from the MrRobot bot, log them, clean them, and allow for announcement of them',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');
const ircTypography = require('../lib/_ircTypography');

module.exports = app => {
    // Do not load module if we have no database
    if (!app.Database || !Models.MrRobotQuotes) {
        return;
    }

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

    const mrRobotQuoteLogging = (to, from, text, message) => {
        if (!text || to != '#MrRobot' || from != 'MrRobot' || _.includes(includeExceptions, text) || text.split(' ').length < 3) {
            return;
        }
        quoteModel.query(qb => {
                qb
                    .select(['quote'])
                    .where('quote', 'like', text)
                    .limit(1);

            })
            .fetch()
            .then(result => {
                if (result) {
                    return;
                }
                quoteModel
                    .insert({
                        quote: text
                    })
                    .then(result => {
                      logger.info(`Added New MrRobot show quote: ${text}`);
                    })
                    .catch(err => logger.error('Error saving result from DB in MrRobotQuote', {err}));
            })
            .catch(err => logger.error('Error getting result from DB in MrRobotQuote', {err}));
    };
    // Listen and Log
    app.Listeners.set('mrrobotquotes', {
        desc: 'Log quotes from #MrRobot',
        call: mrRobotQuoteLogging
    });

    const cleanQuotes = (to, from, text, mesasage) => {
        quoteModel.query(qb => {
                qb.where('quote', 'like', '%(1 more message)%')
                    .select(['id', 'quote']);
            })
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    logger.info('Runnig MrRobot Quote clean up job, nothing to clean up...');
                    return;
                }
                results.forEach(result => {
                    quoteModel
                        .where('id', result.attributes.id + 1)
                        .fetch()
                        .then(secondLine => {
                            result.set('quote',`${result.get('quote').replace('(1 more message)','')} ${secondLine.get('quote')}`).save().then(() => {
                              logger.info(`Cleaned up MrRobot show quotes, merged quote ${result.get('id')} and ${secondLine.get('id')}`);
                              secondLine.destroy();
                            });
                        });
                });
            });
    };
    app.Commands.set('mrrobot-clean', {
        desc: 'Clean multi-line quotes',
        access: app.Config.accessLevels.owner,
        call: cleanQuotes
    });

    // Clear cache every hour
    let cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 0;

    // Schedule job
    scheduler.schedule('cleanMrRobotQuotes', cronTime, cleanQuotes);

    const mrrobot = (to, from, text, message) => {
        let chan = _.first(text) === '#' ?  _.first(text.split(' ')) : false;

        quoteModel.query(qb => {
                qb.select('quote').orderByRaw('rand()').limit(1);
                if (text && !chan) {
                    qb.andWhere('quote', 'like', text);
                }
            })
            .fetch()
            .then(result => {
                if (!result) {
                    app.say(chan || to, `I have not yet encountered anything like that.`);
                    return;
                }
                app.say(chan || to, `${ircTypography.logos.mrrobot} ${result.get('quote')}`);
            });
    };

    app.Commands.set('mrrobot', {
        desc: '[Channel / Search Text] Mr Robot quotes powered by #MrRobot',
        access: app.Config.accessLevels.identified,
        call: mrrobot
    });

    return scriptInfo;
};
