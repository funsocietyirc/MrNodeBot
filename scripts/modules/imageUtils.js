'use strict';
const scriptInfo = {
    name: 'Image Utilitie Module',
    desc: 'Tools to remove all images from the url table, rebuild them, and them should they die',
    createdBy: 'IronY'
};
const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const fileType = require('file-type');
const scheduler = require('../../lib/scheduler');
const extractUrls = require('../../lib/extractUrls');
// Regex Replace Pattern
const hashPattern = new RegExp('%23', 'g');

// Display a list of images in the Web Front end
module.exports = app => {
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

    // Rebuild all images inside the URL table from the Logging table resource
    const buildImages = (to, from, text, message) =>
        Models.Logging.query(qb =>
            qb
                .where(clause =>
                    whereImages(clause, 'text')
                )
                .orderBy('timestamp', 'desc')
        )
            .fetchAll()
            .then(logResults =>
                logResults
                    .forEach(logResult =>
                        _(
                            extractUrls(logResult.get('text'))
                        )
                            .filter(url =>
                                (_.isString(url) ? url : '')['match'](/^http[s]?:\/\/.+\.(jpg|gif|jpeg|png)$/i)
                            )
                            .each(url =>
                                Models.Url.create({
                                    url: url,
                                    to: logResult.get('to'),
                                    from: logResult.get('from'),
                                    timestamp: logResult.get('timestamp')
                                })
                            )
                    )
            )
            .then(() => {
                // Clean up when done
                cleanImages(false);
                app.say(to, 'The Image URL entries have been successfully rebuilt');
            });

    // Destroy All images in the URL Table
    const destroyImages = (to, from, text, message) =>
        Models.Url.query(qb =>
            qb
                .where(whereImages)
        )
            .destroy()
            .then(results =>
                app.say(to, 'The images from the URL Database have been successfully purged')
            );

    // Clean the DB of broken URLS
    const cleanImages = to => {
        if (_.isString(to) && !_.isEmpty(to)) app.say(to, `Running Clean Image command`);
        else logger.info('Running Clean Images');

        Models.Url.query(
            qb => qb.where(whereImages)
        )
            .fetchAll()
            .then(results =>
                results
                    .pluck('url').forEach(url =>
                    rp({
                        uri: url,
                        method: 'GET',
                        encoding: null,
                    })
                        .then(urlResult => {
                            let type = fileType(urlResult);

                            // Get extension
                            let ext = '';
                            if (type && type.ext) ext = type.ext;

                            // If Valid image extension bailout
                            if (ext.match(/^(png|gif|jpg|jpeg)$/i)) return;

                            logger.info(`Removing Non Image link ${url}`);
                            Models.Url.where('url', url).destroy();
                        })
                        .catch(err => {
                            logger.info(`Removing Dead Image link ${url}`);
                            Models.Url.where('url', url).destroy();
                        })
                )
            );
    };

    // Web Front End (Pug View)
    const imagesView = (req, res) => Models.Url.query(qb => {
        // If there is a channel in the query string
        if (req.params.channel) qb.where('to', req.params.channel.replace(hashPattern, '#'));
        // If there is a from in the query string
        if (req.params.user) qb.where('from', req.params.user);
        // Build Up Query
        qb
            .where(whereImages)
            .orderBy('timestamp', req.query.sort || 'desc')
            .limit(req.query.length || 50);
    })
        .fetchAll()
        .then(results => {
            // Get Unique list of channels from results
            let channels = _.uniqBy(results.pluck('to'), c => _.toLower(c));
            // Get Unique list of users from the results
            let users = _.uniqBy(results.pluck('from'), u => _.toLower(u));
            // Return Response
            res.render('images', {
                results: results.toJSON(),
                channels: channels,
                users: users,
                currentChannel: req.params.channel || false,
                currentUser: req.params.user || false,
                moment: require('moment')
            });
        });

    // Register Route with Application
    app.WebRoutes.set('urls', {
        handler: imagesView,
        desc: 'Image Front End',
        path: '/images/:channel?/:user?',
    });

    // Command to clean URLS
    app.Commands.set('clean-images', {
        desc: 'clean images from the logging database if they are no longer relevant',
        access: app.Config.accessLevels.owner,
        call: to => cleanImages(to)
    });

    // Command to build Images
    app.Commands.set('build-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: buildImages
    });

    // Command to destroy images
    app.Commands.set('destroy-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: destroyImages
    });

    // Scheduler automatic cleanup
    // TODO make this configurable ala config.js
    let cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 45;
    scheduler.schedule('cleanImages', cronTime, () => cleanImages(false));

    // Return the script info
    return scriptInfo;
};
