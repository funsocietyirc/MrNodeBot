/**
    Watch Channels for URLS
**/
'use strict';
const scriptInfo = {
    name: 'urlListener',
    file: 'urlListener.js',
    createdBy: 'Dave Richer'
};

const c = require('irc-colors');
const _ = require('lodash');
const xray = require('x-ray')();
const GoogleUrl = require('google-url');

const HashMap = require('hashmap');
const Models = require('bookshelf-model-loader');

const helpers = require('../../helpers');
const pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;

const conLogger = require('../../lib/consoleLogger');

/**
  Translate urls into Google short URLS
  Listeners: shorten
  Npm Requires: google-url
**/
module.exports = app => {
    // Google API Key required
    if (!app.Config.apiKeys.google) {
        return;
    }

    const cronTime = '00 01 * * *';

    // Ignore the users entirely
    const userIgnore = app.Config.features.urls.userIgnore || [];

    // Ignore URL logging for specific channels
    const urlLoggerIgnore = app.Config.features.urls.loggingIgnore || [];

    // Anounce Ignore
    const announceIgnore = app.Config.features.urls.announceIgnore || [];

    // Google API
    const googleUrl = new GoogleUrl({
        key: app.Config.apiKeys.google
    });

    // Cache URLS to prevent unnecessary API calls
    const urlCache = new HashMap();

    // Send To Pusher
    const pusher = (url, to, from, results) => {
        return new Promise((resolve, reject) => {
            // Load in pusher if it is active
            if (!app.Config.pusher.enabled && !app._pusher) {
                resolve(results);
                return;
            }
            let channel = /\.(gif|jpg|jpeg|tiff|png)$/i.test(url) ? 'image' : 'url';
            let timestamp = Date.now();
            let output = {
                url,
                to,
                from,
                timestamp,
                title: results.title || ''
            };
            // Append an ID if we have one
            if (results.id) {
                output.id = results.id;
            }
            if (results.shortUrl) {
                output.shortUrl = results.shortUrl;
            }
            app._pusher.trigger('public', channel, output);
            results.delivered.push({
                protocol: 'pusher',
                to: channel,
                on: timestamp
            });
            resolve(results);
        });
    };

    // Log Urls to the Database
    const logInDb = (url, to, from, results) => {
        // Make sure we have DB Connectivity
        let ignored = urlLoggerIgnore.some(hash => {
            if (_.includes(hash, to.toLowerCase())) {
                return true;
            }
        });
        return new Promise((resolve, reject) => {
            if (!app.Database || !Models.Url || ignored) {
                resolve(results);
                return;
            }
            Models.Url.create({
                    url: url,
                    to: to,
                    from: from,
                    title: results.title
                })
                .then(record => {
                    results.id = record.id;
                    results.delivered.push({
                        protocol: 'database',
                        on: Date.now()
                    });
                    resolve(results);
                })
                .catch((err) => {
                    resolve(results);
                });
        });
    };

    // Begin the chain
    const startChain = url => new Promise((resolve, reject) => {
        if (!url) {
            reject({
                message: 'A URL is required'
            });
            return;
        }
        resolve({
            url,
            delivered: [],
            secure: url.startsWith('https://'),
        });
    });

    // Shorten the URL
    const shorten = (url, results) => new Promise((resolve, reject) => {
        // Check input / Gate
        if (url.startsWith('http://goo.gl/') || url.startsWith('https://goo.gl/')) {
            resolve(results);
            return;
        }
        if (urlCache.has(url)) {
            resolve(_.merge(results, {
                shortUrl: urlCache.get(url)
            }));
            return;
        }
        googleUrl.shorten(url, (err, shortUrl) => {
            if (err) {
                resolve(results);
                return;
            }
            urlCache.set(url, shortUrl);
            resolve(_.merge(results, {
                shortUrl
            }));
        });
    });

    // Get the title
    const getTitle = (url, results) => new Promise((resolve, reject) => {
        xray(url, 'title')((err, title) => {
            if (err || !title) {
                resolve(results);
                return;
            }
            title = _.trim(title)
            resolve(_.merge(results, {
                title: title
            }));
        });
    });

    // Formatting Helper
    const shortSay = (to, from, payload) => {
        let shortString = c.bold('Short:');
        let titleString = c.bold('Title:');
        let output = '';
        if (payload.shortUrl && payload.url.length > app.Config.features.urls.titleMin) {
            output = output + `${shortString} ${c.grey(payload.shortUrl)}`;
        }
        if (payload.title && payload.title != '') {
            let space = output == '' ? '' : ' ';
            output = output + space + `${titleString} ${c.olive(payload.title)}`;
        }
        if (output != '') {
            app.say(to, `(${from}) ` + output);
        }
    };

    // Report back to IRC
    const say = (to, from, results) =>
        new Promise((resolve, reject) => {
            if (!announceIgnore.contains(to)) {
                shortSay(to, from, results);
                results.delivered.push({
                    protocol: 'irc',
                    to: to,
                    on: Date.now()
                });
            }
            resolve(results);
        });

    // Handle Errors
    const handleErrors = err => {
        if (err.message || err.inner) {
            console.log(err.message, err.inner);
        }
    };

    // Extract URLS
    const extractUrls = text => text.toString().match(pattern);

    // Handler
    const listener = (to, from, text) => {
        // Check to see if the user is ignored from url listening, good for bots that repete
        if (userIgnore.contains(from)) return;

        // Get Urls
        let urls = extractUrls(text);

        // Input does not contain urls
        if (!urls) return;

        // Shorten and output
        urls.forEach(url => {
            startChain(url)
                // Process
                .then(results => shorten(url, results))
                .then(results => getTitle(url, results))
                .then(results => say(to, from, results))
                // Report
                .then(results => logInDb(url, to, from, results))
                .then(results => pusher(url, to, from, results))
                .catch(err => handleErrors(err));
        });
    };

    // URL Info
    const urlInfo = (to, from, text, message) => {};

    // List for urls
    app.Listeners.set('url-listener', {
        desc: 'Listen for URLS',
        call: listener
    });

    // Clear cache every hour
    app.schedule('cleanUrls', cronTime, () => {
        conLogger('Clearing Google Short URL Cache', 'info');
        urlCache.clear();
    });


    // Return the script info
    return scriptInfo;
};
