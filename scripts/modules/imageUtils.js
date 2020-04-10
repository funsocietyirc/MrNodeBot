const scriptInfo = {
    name: 'Image Utilities Module',
    desc: 'Tools to remove all images from the url table, rebuild them, and them should they die',
    createdBy: 'IronY',
};
const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const fileType = require('file-type');
const scheduler = require('../../lib/scheduler');
const extractUrls = require('../../lib/extractUrls');
// Regex Replace Pattern
const hashPattern = new RegExp('%23', 'g');

// Display a list of images in the Web Front end
module.exports = (app) => {
    // Bailout if we do not have database
    if (!Models.Url) return scriptInfo;

    // Where image helpers
    const whereImages = (clause, field) => {
        // Default to the URL field if none specified
        field = field || 'url';
        return clause
            .where(field, 'like', '%.jpeg')
            .orWhere(field, 'like', '%.jpg')
            .orWhere(field, 'like', '%.gif')
            .orWhere(field, 'like', '%.png');
    };

    const buildImages = async (to, from, text, message) => {
        try {
            const logResults = await Models.Logging.query(qb =>
                qb
                    .where(clause => whereImages(clause, 'text'))
                    .orderBy('timestamp', 'desc'))
                .fetchAll();

            for (const logResult of logResults) {
                const url = _(
                    extractUrls(logResult.get('text'))
                ).filter(url => (_.isString(url) ? url : '').match(/^http[s]?:\/\/.+\.(jpg|gif|jpeg|png)$/i)).value();
                await Models.Url.create({
                    url,
                    to: logResult.get('to'),
                    from: logResult.get('from'),
                    timestamp: logResult.get('timestamp'),
                });
            }

            await cleanImages(false);

            app.say(to, 'The Image URL entries have been successfully rebuilt');

        } catch (err) {
            logger.error('Something went wrong building images', {
                message: err.message || '',
                stack: err.stack || '',
            })
        }
    };

    const destroyImages = async (to, from, text, message) => {
        try {
            await Models.Url.query(qb => qb.where(whereImages)).destroy({
                require: false
            });
            app.say(to, `The images from the URL Database have been purged`);
        }
        catch (err) {
            logger.error('Something went wrong purging images form the URL database', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }
    };

    /**
     * Clean Images
     * @param to
     * @returns {Promise<void>}
     */
    const cleanImages = async (to) => {
        try {
            if (_.isString(to) && !_.isEmpty(to)) app.say(to, 'Running Clean Image command');
            else logger.info('Running Clean Images');
            const results = await Models.Url.query(qb => qb.where(whereImages)).fetchAll();
            const urls = results.pluck('url');

            // Check we have results
            if (_.isEmpty(urls)) {
                logger.info('No URLS found during clean up');
                return;
            }

            for (const url of urls) {
                try {
                    // Grab the web results
                    const urlResult = await rp({
                        uri: url,
                        method: 'GET',
                        encoding: null,
                        timeout: 120000,
                    });

                    // Get extension
                    const type = fileType(urlResult);
                    const ext = (type && type.ext) ? type.ext : '';

                    // If Valid image extension bailout
                    if (ext.match(/^(png|gif|jpg|jpeg)$/i)) continue;

                    // Attempt Removal
                    logger.info(`Removing Non Image link ${url}`);
                    Models.Url.where('url', url).destroy({
                        require: false
                    });
                } catch (innerErr) {
                    try {
                        logger.info(`Removing Dead Image link ${url}`);
                        Models.Url.where('url', url).destroy({
                            require: false
                        });
                    }
                    catch (innerInnerError) {
                        logger.error(`Something went wrong removing a dead image link`, {
                            message: innerInnerError.message || '',
                            stack: innerInnerError.stack || '',
                        });
                    }
                }
            }
        }
        catch (err) {
            logger.error(`Something went wrong deleting a non image link`, {
                message: err.message || '',
                stack: err.stack || '',
            })
        }
    };

    const imagesView = async (req, res, next) => {
        try {
            const results = await Models.Url.query((qb) => {
                // If there is a channel in the query string
                if (req.params.channel) qb.where('to', req.params.channel.replace(hashPattern, '#'));
                // If there is a from in the query string
                if (req.params.user) qb.where('from', req.params.user);
                // Build Up Query
                qb
                    .where(whereImages)
                    .orderBy('timestamp', req.query.sort || 'desc')
                    .limit(req.query.length || 50);
            }).fetchAll();

            // Get Unique list of channels from results
            const channels = _.uniqBy(results.pluck('to'), c => _.toLower(c));
            // Get Unique list of users from the results
            const users = _.uniqBy(results.pluck('from'), u => _.toLower(u));
            // Return Response
            res.render('images', {
                results: results.toJSON(),
                channels,
                users,
                currentChannel: req.params.channel || false,
                currentUser: req.params.user || false,
                moment: require('moment'),
            });
        }
        catch (err) {
            return next(err);
        }
    };

    // Register Route with Application
    app.webRoutes.associateRoute('urls', {
        handler: imagesView,
        desc: 'Images',
        path: '/images/:channel?/:user?',
        navEnabled: true,
        navPath: '/images/'
    });

    // Command to clean URLS
    app.Commands.set('clean-images', {
        desc: 'clean images from the logging database if they are no longer relevant',
        access: app.Config.accessLevels.owner,
        call: to => cleanImages(to),
    });

    // Command to build Images
    app.Commands.set('build-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: buildImages,
    });

    // Command to destroy images
    app.Commands.set('destroy-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: destroyImages,
    });

    // Scheduler automatic cleanup
    // TODO make this configurable ala config.js
    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 40;
    cronTime.hour = 1;
    scheduler.schedule('cleanImages', cronTime, () => cleanImages(false));

    // Return the script info
    return scriptInfo;
};
