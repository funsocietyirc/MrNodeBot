'use strict';

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const logger = require('../../lib/logger');

// Ignore URL logging for specific channels
const urlLoggerIgnore = require('../../config').features.urls.loggingIgnore || [];

module.exports = results => new Promise(resolve => {
    // Filter the ignore list
    let ignored = urlLoggerIgnore.some(hash => {
        if (_.includes(hash, _.toLower(results.to))) {
            return true;
        }
    });

    // Gate
    if (!Models.Url || ignored) return resolve(results);

    // Do the magic
    return Models.Url.create({
            url: results.url,
            to: results.to,
            from: results.from,
            title: results.title
        })
        .then(record => {
            results.id = record.id;
            results.delivered.push({
                protocol: 'urlDatabase',
                on: Date.now()
            });
            return results;
        })
        // Log Youtube Url
        .then(results => {
            // There are no youtube results, bail
            if (_.isUndefined(results.youTube)) return results;
            // Return the record
            return Models.YouTubeLink.create({
                url: results.url,
                to: results.to,
                from: results.from,
                title: results.youTube.videoTitle,
                user: results.message.user,
                host: results.message.host
            });
        })
        .then(record => {
            results.delivered.push({
                protocol: 'youTubeDatabase',
                on: Date.now(),
                id: record.id
            });
            return results;
        })
        .then(results => resolve)
        .catch(err => {
            logger.error('Error in the DB URL function', {
                err
            });
            resolve(results);
        });

});
