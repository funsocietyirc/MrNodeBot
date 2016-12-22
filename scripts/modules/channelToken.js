'use strict';
const scriptInfo = {
    name: 'Channel Token',
    desc: 'Give a IRC user a unique token that identifies them to a channel',
    createdBy: 'IronY'
};
const moment = require('moment');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');
const randToken = require('rand-token');
const scheduler = require('../../lib/scheduler');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Token) return;

    // Hold the token model
    const tokenModel = Models.Token;

    // Go through the users tokens and remove them if they are over a week old
    const cleanTokens = scheduler.schedule('cleanTokens', {
        hour: 0,
        minute: 0
    }, () => {
        let now = moment();

        tokenModel
            .fetchAll()
            .then(results =>
                results.forEach(result => {
                    // This is not a very old record, move on
                    if (now.diff(moment(result.attributes.timestamp), 'weeks') < 1) return;
                    return result
                        .destroy()
                        .then(deleted => logger.info(`User Token for ${result.attributes.user} on ${result.attributes.channel} has been removed`))
                        .catch(err => logger.error('Error In removing a user token', {
                            err
                        }));
                }))
            .then(() => logger.info('Finished clearing User Token'))
            .catch(err => logger.error('Error removing User tokens', {
                err
            }));
    });

    // API End point, get a nick verified by channel token
    const getNickByTokenApi = (req, res) => {
        let error = {
            status: 'error',
            result: null
        };
        let token = req.body.token;

        // No token available
        if (!token) return res.json(error);

        tokenModel.query(qb =>
                qb
                .where('token', token)
                .select(['user', 'channel', 'timestamp'])
            )
            .fetch()
            .then(result => {
                if (!result) return res.json(error);

                res.json({
                    status: 'success',
                    result: result
                });
            });
    };

    // Register upload Handler
    app.WebRoutes.set('getNickByToken', {
        handler: getNickByTokenApi,
        desc: 'Handle File Upload',
        path: '/api/getNickByToken',
        name: 'getNickByToken',
        verb: 'post'
    });

    // Register a user to a token
    const registerToken = (to, from, text, message) => {
        // Only accept messages from channel
        if (to === from) {
            app.say(to, 'You must be in a channel to request a token');
            return;
        }

        let token = randToken.generate(8);

        tokenModel
            .query(qb =>
                qb
                .where('user', from)
                .where('channel', to)
            )
            .fetch()
            .then(result => {
                // If no previous tokens exist
                if (!result) {
                    tokenModel.create({
                            user: from,
                            channel: to,
                            token: token
                        })
                        .then(() => {
                            app.say(to, `Your token has been safely private messaged to you ${from}`);
                            app.say(from, `Your new token for ${to} is ${token}, it will expire in 7 days`);
                        });
                }
                // If previous token exists
                else {
                    tokenModel
                        .where({
                            user: from,
                            channel: to,
                        })
                        .save({
                            token: token,
                            timestamp: Models.Bookshelf.knex.fn.now(),
                        }, {
                            patch: true
                        })
                        .then(() => app.say(from, `Your new token for ${to} is ${token}`));
                }
            });
    };
    // Register token
    app.Commands.set('token', {
        desc: 'Get a unique token for uploading images to file',
        access: app.Config.accessLevels.identified,
        call: registerToken
    });

    return scriptInfo;
};
