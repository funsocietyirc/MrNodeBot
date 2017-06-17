'use strict';

const scriptInfo = {
    name: 'Sentiment Line',
    desc: 'Get a random sentiment',
    createdBy: 'IronY'
};

const _ = require('lodash');
const Moment = require('moment');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const typo = require('../lib/_ircTypography');

module.exports = async (app) => {
    // Database not available
    if (!Models.Upvote) return scriptInfo;

    // random-sentiment command
    app.Commands.set('random-sentiment', {
        desc: 'Get a random sentiment',
        access: app.Config.accessLevels.identified,
        call: async (to, from, text, message) => {
            try {
                const result = await Models.Upvote.query(
                    qb => qb
                        .select('candidate', 'voter','text','result','channel')
                        .where('channel', to)
                        .whereNotNull('text')
                        .orderByRaw('rand()')
                        .limit(1)
                ).fetch();

                if(!result) {
                    app.say(to,`It seems there is no sentiments for ${to}, ${from}`);
                    return;
                }

                const disposition = result.get('result') === 1 ? '{likes|adores}' : '{dislikes|hates}';
                let output = `${result.get('voter')} ${disposition} ${result.get('candidate')} ${result.get('text')} [${Moment(result.get('timestamp')).fromNow()}]`;
                app.say(to, output);
            }
            catch (err) {
                logger.error('Something went wrong in randomSentiment', {
                    message: err.message || '',
                    stack: err.stack || ''
                });
                app.say(to, `Something went wrong finding a random sentiment, ${from}`);
            }
        }
    });

};