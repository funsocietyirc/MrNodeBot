'use strict';
const scriptInfo = {
    name: 'fiximages',
    file: 'fiximages.js',
    createdBy: 'Dave Richer'
};
const pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
const Models = require('bookshelf-model-loader');
const _ = require('lodash');
module.exports = app => {
    if (!app.Database && !Models.Logging) {
        return;
    }

    const extractUrls = text => text.toString().match(pattern);

    const destroyImages = (to, from, text, message) => {
        Models.Url.query(qb => {
            qb
                .where('url', 'like', '%.jpeg')
                .orWhere('url', 'like', '%.jpg')
                .orWhere('url', 'like', '%.gif')
                .orWhere('url', 'like', '%.png')
        }).destroy().then(results => {
            app.say(from, 'The images from the URL Database have been successfully purged');
        });
    };

    const buildImages = (to, from, text, message) => {
        Models.Logging.query(qb => {
                qb
                    .where('text', 'like', '%.jpeg%')
                    .orWhere('text', 'like', '%.jpg%')
                    .orWhere('text', 'like', '%.gif%')
                    .orWhere('text', 'like', '%.png%')
                    .orderBy('timestamp', 'desc');
            })
            .fetchAll()
            .then(logResults => {
                logResults.forEach(logResult => {
                    let resultText = logResult.get('text');
                    let resultFrom = logResult.get('from');
                    let resultTo = logResult.get('to');
                    let resultTimestamp = logResult.get('timestamp');
                    let urls = extractUrls(resultText);
                    if (!urls) return;
                    urls.forEach(url => {
                        if (!url.startsWith('http')) {
                            return;
                        }
                        Models.Url.create({
                            url: url,
                            to: resultTo,
                            from: resultFrom,
                            timestamp: resultTimestamp
                        });
                    });
                });

                app.say(from, 'The Images have been succesfully rebuilt');
            });
    };

    // Register Tweet Command
    app.Commands.set('build-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: buildImages
    });
    // Register Tweet Command
    app.Commands.set('destroy-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: destroyImages
    });

    return scriptInfo;
};
