//   MrNodeBot URL Announce feature:
//     This will take in a line of text, parse it for URLS, it will then iterate through
//     each url and grab meta data on it. This includes checking if the URL is alive,
//     grabbing the request header params, checking content type, extracting title. The url is also
//     ran against matches for other APIS used to extract data, such has youtube/imdb..
//     The resulting information is then sent back to be displayed on IRC, broadcast over Socketio, and logged via DB.
//     If we are in debug mode a complete chain of information will be echoed to the console.
//
//     The basic concept of this is a promise/function that takes in a results object, and returns either
//     a modified results object, or in case of error, that same results object.
const scriptInfo = {
    name: 'urlListener',
    desc: 'Listen for URLS, append them to a DB table, clean them if they expire, and other stuff including pulling proper meta data',
    createdBy: 'IronY',
};
const _ = require('lodash');
const logger = require('../../lib/logger');
const extractUrls = require('../../lib/extractUrls');

// Build
const startChain = require('./_startChain.js'); // Begin the chain
const startCachedChain = require('./_startCachedChain'); // Begin cache chain
const getDocument = require('./_getDocument'); // Get the title
const matcher = require('././_linkMatcher'); // Link Matcher
const getShorten = require('./_getShort'); // Shorten the URL
const safeCheck = require('./_googleSafeCheck'); // Google Safe Check
const endChain = require('./_endChain'); // Finish the chain

// Report
const sendToDb = require('./_sendToDb'); // Log Urls to the Database
const sendToSocket = require('./_sendToSocket'); // Send To Socketio

// Libs
const ircUrlFormatter = require('./_ircUrlFormatter'); // IRC Formatter
const scheduler = require('../../lib/scheduler');

// Cache URLS to prevent unnecessary API calls
const resultsCache = require('../../lib/hashedCacheStore');

module.exports = (app) => {
    // Libs
    const announceIgnore = app.Config.features.urls.announceIgnore || [];

    // Fetch the ignore list
    const userIgnore = app.Config.features.urls.userIgnore || [];

    const maxLength = app.Config.features.urls.maxLength || 10485760;
    const userAgent = app.Config.features.urls.userAgent || 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

    // Send Response to IRC
    const sendToIrc = (results) => {
        if (!_.includes(announceIgnore, results.to)) {
            ircUrlFormatter(results, app);
            results.delivered.push({
                protocol: 'irc',
                on: Date.now(),
            });
        }
        return results;
    };

    // Individual URL Processing chain
    const processUrl = (url, to, from, text, message, is) => {
        const chain = resultsCache.has(url) ? startCachedChain : startChain; // Load appropriate start method based on cache

        chain(url, to, from, text, message, is) // Begin Chain
            .then(results => (results.cached ? results : // If we Have a cached object, continue in chain
                getDocument(results, userAgent, maxLength) // Make a request, verify the site exists, and grab metadata
                    .then(safeCheck)
                    .then(results => (results.unreachable ? results : // If the site is not up, continue the chain
                        getShorten(results) // Otherwise grab the google SHORT Url
                            .then(matcher)), // Then send it to the regex matcher
                    )))
            .then((results) => {
                // Check to see if there is a re-post limit
                if (
                    _.isObject(app.Config.features.urls.repostLimit) &&
                    to in app.Config.features.urls.repostLimit &&
                    Number.isInteger(app.Config.features.urls.repostLimit[to]) &&
                    results.history.length >= app.Config.features.urls.repostLimit[to] &&
                    results.history.filter(x => x.to === to).length > 0
                ) {
                    return results;
                }

                // There is not a re-post limit
                return sendToIrc(results);
            }) // Send Results to IRC
            .then(results => (results.unreachable ? results : // If the site is unreachable, carry on in chain
                sendToDb(results) // Otherwise Log To Database
                    .then(results => sendToSocket(app, results))), // Then broadcast to socketio
            )
            .then(endChain) // End the chain, cache results
            .catch(err => logger.warn('Error in URL Listener chain', {
                err: err.message || '',
                stack: err.stack || '',
            }));
    };

    // Handler
    const listener = (to, from, text, message, is) => {
        // Check to see if the user is ignored from url listening, good for bots that repeat
        if (_.includes(userIgnore, from)) return;

        // Set chaining limit
        const limit = (
            _.isObject(app.Config.features.urls.chainingLimit) &&
            to in app.Config.features.urls.chainingLimit &&
            _.isNumber(app.Config.features.urls.chainingLimit[to])
        ) ? app.Config.features.urls.chainingLimit[to] : 0;

        // Url Processing chain
        const urls = _(extractUrls(text, limit))
            .uniq() // Assure No Duplicated URLS on the same line return multiple results
            .filter(url => url.match(/^(www|http[s]?)/im)) // Filter out undesired protocols
            .map(url => (url.toLowerCase().startsWith('http') ? url : `http://${url}`)); // Does not start with a protocol, prepend http://

        if (urls.length && to === from) {
            app.say(from, `You cannot paste me URLS ${from}, if you register with NickServ you can use the url command how ever.`);
            return;
        }

        urls.each(url => processUrl(url, to, from, text, message, is));
    };

    // List for urls
    app.Listeners.set('url-listener', {
        desc: 'Listen for URLS',
        call: listener,
    });

    // Expose the link matcher via a url command
    app.Commands.set('url', {
        desc: 'Validate URL',
        access: app.Config.accessLevels.identified,
        call: listener,
    });

    // Clear cache every four hours on the 30 min mark
    const clean = scheduler.schedule('urlResultCache', {
        hour: [0, 4, 8, 12, 16, 20],
        minute: 15,
    }, () => {
        logger.info('Clearing The Url Result Cache');
        resultsCache.clear();
    });

    // Allow the manual clearing of cache
    app.Commands.set('clear-url-cache', {
        desc: 'Clear the URL Cache',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            resultsCache.clear();
            app.say(to, 'The URL Result Cache has been cleared');
        },
    });

    // Return the script info
    return scriptInfo;
};
