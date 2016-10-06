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


    const fix = (to, from, text, message) => {
        Models.Logging.query(qb => {
                qb
                    .where('text', 'like', '%.jpeg%')
                    .orWhere('text', 'like', '%.jpg%')
                    .orWhere('text', 'like', '%.gif%')
                    .orWhere('text', 'like', '%.png%');
            })
            .fetchAll()
            .then(logResults => {
                logResults.forEach(logResult => {
                    let text = logResult.get('text');
                    let from = logResult.get('from');
                    let to = logResult.get('to');
                    let timestamp = logResult.get('timestamp');
                    let urls = extractUrls(text);
                    if (!urls) return;
                    urls.forEach(url => {
                        if (!url.startsWith('http')) {
                            return;
                        }
                        console.log(url);
                        Models.Url.create({
                            url: url,
                            to: to,
                            from: from,
                            timestamp: timestamp
                        });
                    })

                });
            });
    };

    // Register Tweet Command
    app.Commands.set('fix-images', {
        desc: '',
        access: app.Config.accessLevels.owner,
        call: fix
    });

    return scriptInfo;
};
