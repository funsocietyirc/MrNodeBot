'use strict';

/**
  MrNodeBot URL Announce feature:
    This will take in a line of text, parse it for URLS, it will then itterate through
    each url and grab meta data on it. This includes checking if the URL is alive,
    grabbing the request header params, checking content type, extracting title. The url is also
    ran against matches for other APIS used to extract data, such has youtube/imdb..
    The resulting information is then sent back to be displayed on IRC, broadcast over Pusher, and logged via DB.
    If we are in debug mode a complete chain of information will be echoed to the console.

    The basic concept of this is a promise/function that takes in a results object, and returns either
    a modified results object, or in case of error, that same results object.
**/

const scriptInfo = {
    name: 'urlListener',
    desc: 'Listen for URLS, append them to a DB table, clean them if they expire, and other stuff including pulling proper meta data',
    createdBy: 'IronY'
};

const _ = require('lodash');

const extractUrls = require('../../lib/extractUrls');
const logger = require('../../lib/logger');

// Build
const startChain = require('./_startChain.js'); // Begin the chain
const startCachedChain = require('./_startCachedChain'); // Begin cache chain
const getDocument = require('./_getDocument'); // Get the title
const matcher = require('././_linkMatcher'); // Link Matcher
const getShorten = require('./_getShort'); // Shorten the URL
const endChain = require('./_endChain'); // Finish the chain
// Report
const sendToDb = require('./_sendToDb'); // Log Urls to the Database
const sendToPusher = require('./_sendToPusher'); // Send To Pusher
// Libs
const ircUrlFormatter = require('./_ircUrlFormatter'); // IRC Formatter
const scheduler = require('../../lib/scheduler');
// Cache URLS to prevent unnecessary API calls
const resultsCache = require('./_resultsCacheStore');

module.exports = app => {

    // Libs
    const announceIgnore = app.Config.features.urls.announceIgnore || [];

    // Fetch the ignore list
    const userIgnore = app.Config.features.urls.userIgnore || [];

    // Send Response to IRC
    const sendToIrc = results => {
        if (!_.includes(announceIgnore, results.to)) {
            let output = ircUrlFormatter(results);
            // Bail if we have no output
            if (!_.isEmpty(output)) {
                // Report back to IRC
                app.say(results.to, output);
            }
            results.delivered.push({
                protocol: 'irc',
                on: Date.now()
            });
        }
        return results;
    };

    // Individual URL Processing chain
    const processUrl = (url, to, from, text, message, is) => {
        let isCached = resultsCache.has(url); // Check if it is Cached
        let chain = isCached ? startCachedChain : startChain; // Load appropriate start method

        chain(url, to, from, text, message, is) // Begin Chain
            .then(results => results.isCached ? results : // If we Have a cached object, continue in chain
                getDocument(results) // Make a request, verify the site exists, and grab metadata
                .then(results => results.unreachable ? results : // If the site is no up, continue the chain
                    getShorten(results) // Otherwise grab the google SHORT Url
                    .then(matcher) // Then send it to the regex matcher
                ))
            .then(sendToIrc) // Send Results to IRC
            .then(results => results.unreachable ? results : // If the site is unreachable, carry on in chain
                sendToDb(results) // Otherwise Log To Database
                .then(sendToPusher) // Then broadcast to pusher
            )
            .then(endChain) // End the chain, cache results
            .catch(err => logger.warn('Error in URL Listener chain', {
                err
            }));
    };

    // Handler
    const listener = (to, from, text, message, is) => {
        // Check to see if the user is ignored from url listening, good for bots that repete
        if (_.includes(userIgnore, from)) return;

        // Url Processing chain
        _(extractUrls(text))
            .uniq() // Assure No Duplicated URLS on the same line return multiple results
            .reject(url => url.startsWith('ftp')) // We do not deal with FTP
            .each(url => processUrl(url, to, from, text, message, is));
    };

    // List for urls
    app.Listeners.set('url-listener', {
        desc: 'Listen for URLS',
        call: listener
    });

    // Clear cache every four hours on the 30 min mark
    const clean = scheduler.schedule('urlResultCache', {
        hour: [0, 4, 8, 12, 16, 20],
        minute: 15
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
            app.say(from, 'The URL Result Cache has been cleared');
        }
    });

    // Return the script info
    return scriptInfo;
};
