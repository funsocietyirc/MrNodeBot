/**
    Watch Channels for URLS
**/
'use strict';

const GoogleUrl = require('google-url');
const HashMap = require('hashmap');
const color = require('irc-colors');
const helpers = require('../../helpers');
const _ = require('lodash');
const xray = require('x-ray')();

/**
  Translate urls into Google short URLS
  Listeners: shorten
  Npm Requires: google-url
**/
module.exports = app => {
    // Ignore List For Google shortr responder
    const googleShortIgnore = app.Config.features.urls.googleShortIgnore;
    // Ignore URL logging for specific channels
    const urlLoggerIgnore = app.Config.features.urls.loggingIgnore;

    // Formatting Helper
    const shortSay = (to, from, payload) => {
        let fromString = color.bgwhite.black.bold('From:');
        let shortString = color.bgwhite.black.bold('Short:');
        let titleString = color.bgwhite.black.bold('Title:');
        let output = '';
        if (payload.shortUrl != null && payload.url.length > app.Config.features.urls.titleMin) {
            output = output + `${shortString} ${color.blue(payload.shortUrl)}`;
        }
        if (payload.title != '') {
            let space = output == '' ? '' : ' ';
            output = output + space + `${titleString} ${color.yellow(payload.title.trim())}`;
        }
        if (output != '') {
            app.Bot.say(to, `(${from}) ` + output);
        }
    };

    // Google API Key required
    if (!app.Config.apiKeys.google) {
        return;
    }

    // Google API
    const googleUrl = new GoogleUrl({
        key: app.Config.apiKeys.google
    });

    // Cache URLS to prevent uncessary API calls
    const urlCache = new HashMap();
    // Clear cache every hour
    app.Scheduler.scheduleJob(app.Config.features.urls.cacheCleanup, () => {
        urlCache.clear();
    });

    // Log Urls to the Database
    const logUrlInDb = (url, to, from) => {
        // Make sure we have DB Connectivity
        if (!app.Database ||
            !app.Models.has('url') ||
            urlLoggerIgnore.some(hash => {
                if (_.includes(hash, to.toLowerCase())) {
                    return true;
                }
            })
        ) {
            return;
        }

        // Grab the model

        let urlModel = app.Models.get('url');
        // Log the url to the db
        new urlModel({
                url: url,
                to: to,
                from: from
            })
            .save()
            .catch((err) => {
                console.log(err);
            });
    };

    // Shorten Urls through google service and send them back
    // config.googleShorten needs to exist has a blank array
    const googleShorten = (url, to, from) => {
        // Check input / Gate
        if (
            url.startsWith('http://goo.gl/') ||
            url.startsWith('https://goo.gl/') ||
            googleShortIgnore.some(hash => {
                if (_.includes(hash, to.toLowerCase())) {
                    return true;
                }
            })
        ) {
            return;
        }
        if (urlCache.has(url)) {
            shortSay(to, from, urlCache.get(url));
        } else {
            // Shorten URL
            googleUrl.shorten(url, (err, shortUrl) => {
                // Something tripped up the regex, return on error
                // Props to burnout
                if (err) {
                    return;
                }
                // Try to extract a title
                xray(url, 'title')((err, title) => {
                    // If we have an error the page does not exist
                    if (err || title == '404 File Not Found') {
                        return;
                    }

                    let finalResults = {
                        shortUrl: shortUrl,
                        title: title,
                        url: url,
                    };
                    shortSay(to, from, finalResults);
                    urlCache.set(url, finalResults);
                });
                //
            });
        }
    };

    // Handler
    const handle = (to, from, text) => {
        const pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
        // Array of urls
        let urls = text.toString().match(pattern);

        // Actions to pass them too
        let actions = [
            logUrlInDb,
            googleShorten
        ];

        // Input does not contain urls
        if (!urls) {
            return;
        }

        // Shorten and output
        urls.forEach(url => {
            actions.forEach(action => {
                action(url, to, from);
            });
        });
    };

    // List for urls
    app.Listeners.set('url-listner', {
        desc: 'Listen for URLS',
        call: handle
    });
};
