'use strict';
const scriptInfo = {
    name: 'Image Utilitie Module',
    desc: 'Tools to remove all images from the url table, rebuild them, and them should they die',
    createdBy: 'IronY'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const extractUrls = require('../../lib/extractUrls');
const fileType = require('file-type');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const scheduler = require('../../lib/scheduler');

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
    const buildImages = (to, from, text, message) => {
        Models.Logging.query(qb => qb
                .where(clause => whereImages(clause, 'text'))
                .orderBy('timestamp', 'desc')
            )
            .fetchAll()
            .then(logResults => logResults
                .forEach(logResult => {
                    _(extractUrls(logResult.get('text')))
                        .filter(url => (_.includes(url, '.jpeg') || _.includes(url, '.jpg') || _.includes(url, '.gif') || _.includes(url, '.png')) && url.startsWith('http'))
                        .each(url => Models.Url.create({
                            url: url,
                            to: logResult.get('to'),
                            from: logResult.get('from'),
                            timestamp: logResult.get('timestamp')
                        }));
                })
            )
            .then(() => {
                // Clean up when done
                cleanImages();
                app.say(from, 'The Image URL enteries have been successfully rebuilt');
            })
    };

    // Destory All images in the URL Table
    const destroyImages = (to, from, text, message) => {
        Models.Url.query(qb => qb
                .where(whereImages)
            )
            .destroy()
            .then(results => app.say(from, 'The images from the URL Database have been successfully purged'));
    };

    // Clean the DB of broken URLS
    const cleanImages = () => {
        logger.info('Running Clean Images');
        Models.Url.query(qb => qb
                .where(whereImages)
            )
            .fetchAll()
            .then(results => results
                .pluck('url').forEach(url => {
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
                            if (ext === 'png' || ext === 'gif' || ext === 'jpg' || ext === 'jpeg') return;

                            logger.info(`Removing Non Image link ${url}`);
                            Models.Url.where('url', url).destroy();
                        })
                        .catch(err => {
                            logger.info(`Removing Dead Image link ${url}`);
                            Models.Url.where('url', url).destroy();
                        });
                })
            );
    };

    // Web Front End (Pug View)
    const imagesView = (req, res) => {
        Models.Url.query(qb => {
                // If there is a channel in the query string
                if (req.params.channel) qb.where('to', req.params.channel.replaceAll('%23', '#'));

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
                res.render('images', {
                    results: results.toJSON(),
                    channels: channels,
                    users: users,
                    currentChannel: req.params.channel || false,
                    currentUser: req.params.user || false,
                    moment: require('moment')
                });
            });
    };

    // Register Route with Application
    app.WebRoutes.set('urls', {
        handler: imagesView,
        desc: 'Image Front End',
        path: '/images/:channel?/:user?',
        name: 'urls'
    });

    // Command to clean URLS
    app.Commands.set('clean-images', {
        desc: 'clean images from the logging database if they are no longer relevent',
        access: app.Config.accessLevels.owner,
        call: cleanImages
    });

    // Command to build Images
    app.Commands.set('build-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: buildImages
    });

    // Comand to destroy images
    app.Commands.set('destroy-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: destroyImages
    });

    // Scheduler automatic cleanup
    let cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 45;
    scheduler.schedule('cleanImages', cronTime, () => cleanImages());

    // Return the script info
    return scriptInfo;
};
