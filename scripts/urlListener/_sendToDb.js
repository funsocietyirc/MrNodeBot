'use strict';

const _ = require('lodash');
const Models = require('bookshelf-model-loader');

// Ignore URL logging for specific channels
const urlLoggerIgnore = require('../../config').features.urls.loggingIgnore || [];

module.exports = (results) => {
    if (results.unreachable) {
        return results;
    }
    let ignored = urlLoggerIgnore.some(hash => {
        if (_.includes(hash, _.toLower(results.to))) {
            return true;
        }
    });
    if (!Models.Url || ignored) {
        return results;
    }
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
            if (_.isUndefined(results.youTube)) {
                return results;
            }

            return Models.YouTubeLink.create({
                    url: results.url,
                    to: results.to,
                    from: results.from,
                    title: results.youTube.videoTitle,
                    user: results.message.user,
                    host: results.message.host
                })
                .then(record => {
                    results.delivered.push({
                        protocol: 'youTubeDatabase',
                        on: Date.now()
                    });
                    return results;
                });
        })
        .catch((err) => {
            console.log('Error in the DB function of the url listener');
            console.dir(err);
            return results;
        });
};
