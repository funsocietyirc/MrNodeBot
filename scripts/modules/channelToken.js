const scriptInfo = {
    name: 'Channel Token',
    desc: 'Give a IRC user a unique token that identifies them to a channel',
    createdBy: 'IronY',
};
const moment = require('moment');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const randToken = require('rand-token');
const scheduler = require('../../lib/scheduler');

module.exports = (app) => {
    // Log nick changes in the alias table
    if (!Models.Token) return;

    // Hold the token model
    const tokenModel = Models.Token;

    // Go through the users tokens and remove them if they are over a week old
    const cleanTokens = scheduler.schedule('cleanTokens', {
        hour: 0,
        minute: 0,
    }, async () => {
        const now = moment();

        try {
            const results = await tokenModel.fetchAll();
            for (const result of results) {
                // This is not a very old record, move on
                if (now.diff(moment(result.attributes.timestamp), 'weeks') < 1) continue;
                await result.destroy({require: false});
                logger.info(`User Token for ${result.attributes.user} on ${result.attributes.channel} has been removed`);
            }
        } catch (err) {
            logger.error('Error In removing a user token', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    });

    // API End point, get a nick verified by channel token
    const getNickByTokenApi = async (req, res) => {
        const error = {
            status: 'error',
            result: null,
        };

        const token = req.body.token;

        // No token available
        if (!token) return res.json(error);

        try {
            const result = await tokenModel
                .query(qb =>
                    qb
                        .where('token', token)
                        .select(['user', 'channel', 'timestamp']))
                .fetch();

            if (!result) return res.json(error);

            res.json({
                status: 'success',
                result,
            });
        } catch (err) {
            logger.error('Something went wrong in getNickByTokenApi', {
                message: err.message || '',
                stack: err.stack || '',
            });
            res.json(error);
        }
    };

    // Register upload Handler
    app.webRoutes.associateRoute('getNickByToken', {
        handler: getNickByTokenApi,
        desc: 'Handle File Upload',
        path: '/api/getNickByToken',
        verb: 'post',
    });

    // Register a user to a token
    const registerToken = async (to, from, text, message) => {
        // Only accept messages from channel
        if (to === from) {
            app.say(to, 'You must be in a channel to request a token');
            return;
        }

        const token = randToken.generate(8);

        try {
            const result = await tokenModel
                .query(qb =>
                    qb
                        .where('user', from)
                        .where('channel', to))
                .fetch();

            // If no previous tokens exist
            if (!result) {
                await tokenModel.create({
                    user: from,
                    channel: to,
                    token,
                });
                app.say(to, `Your token has been safely private messaged to you ${from}`);
                app.say(from, `Your new token for ${to} is ${token}, it will expire in 7 days`);
            }
            // If previous token exists
            else {
                await tokenModel
                    .where({
                        user: from,
                        channel: to,
                    })
                    .save({
                        token,
                        timestamp: Models.Bookshelf.knex.fn.now(),
                    }, {
                        patch: true,
                    });

                app.say(from, `Your new token for ${to} is ${token}`);
            }
        } catch (err) {
            logger.error('Something went wrong generating a web token', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong generating your Web Token, ${from}`);
        }
    };

    // Register token
    app.Commands.set('token', {
        desc: 'Get a unique token for uploading images to file',
        access: app.Config.accessLevels.identified,
        call: registerToken,
    });

    return scriptInfo;
};
