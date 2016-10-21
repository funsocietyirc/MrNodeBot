'use strict';

const _ = require('lodash');
const xray = require('x-ray')();
const helpers = require('../../helpers');
const scheduler = require('../../lib/scheduler');
const conLogger = require('../../lib/consoleLogger');
const HashMap = require('hashmap');

// In Memory Cacheing
const titleCache = new HashMap();
const cronTime = '00 00 * * *';
// Clear cache every hour
scheduler.schedule('cleanTitles', cronTime, () => {
    conLogger('Clearing Page Title Cache', 'info');
    titleCache.clear();
});

module.exports = results => new Promise((resolve, reject) => {
    // Title already exists in the cache
    if (titleCache.has(results.url)) {
        return _.merge(results, {
            title: titleCache.get(results.url)
        });
    }

    xray(results.url, 'title')((err, title) => {
        if (err || !title) {
            resolve(results);
            return;
        }
        let formatedTitle = helpers.StripNewLine(_.trim(title));
        titleCache.set(results.url, formatedTitle);
        resolve(_.merge(results, {
            title: formatedTitle
        }));
    });
});
