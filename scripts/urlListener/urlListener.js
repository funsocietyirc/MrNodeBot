'use strict';

const scriptInfo = {
    name: 'urlListener',
    file: 'urlListener.js',
    desc: 'Listen for URLS, append them to a DB table, clean them if they expire, and other stuff including pulling proper meta data',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');

const helpers = require('../../helpers');
const conLogger = require('../../lib/consoleLogger');

// Build
const startChain = require('./_startChain.js'); // Begin the chain
const startCachedChain = require('./_startCachedChain'); // Begin cache chain
const getShorten = require('./_getShort'); // Shorten the URL
const getTitle = require('./_getTitle'); // Get the title
const getGenericInfo = require('./_getGenericInfo'); // Get Generic Link matches
const getImdb = require('./_getImdb.js'); // Get IMDB Data
const getYoutube = require('./_getYoutube.js'); // Get the youtube key from link
const endChain = require('./_endChain'); // Finish the chain

// Report
const sendToDb = require('./_sendToDb'); // Log Urls to the Database
const sendToPusher = require('./_sendToPusher'); // Send To Pusher

const HashMap = require('hashmap');
const scheduler = require('../../lib/scheduler');

// Libs
const ircUrlFormatter = require('./_ircUrlFormatter'); // IRC Formatter

// Cache URLS to prevent unnecessary API calls
const resultsCache = require('./_resultsCache');

module.exports = app => {

    // Libs
    const announceIgnore = app.Config.features.urls.announceIgnore || [];
    // Fetch the ignore list
    const userIgnore = app.Config.features.urls.userIgnore || [];

    // Link matcher
    const matcher = results => {
        if (results.unreachable) {
            return results;
        }
        // Google Short URL has been expnded, we will use that to
        // run the expressions through
        let url = results.realUrl ? results.realUrl : results.url;

        // Check for youTube
        let ytMatch = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);

        // If We have a valid Youtube Link
        if (ytMatch && ytMatch[2].length == 11) {
            return getYoutube(ytMatch[2], results);
        }

        // Check for IMDB
        let imdbMatch = url.match(/(?:www\.)?imdb.com\/title\/(tt[^\/]+).*/);
        if (imdbMatch && imdbMatch[1]) {
            return getImdb(imdbMatch[1], results);
        }

        // Get Generic Information
        let genericMatch = url.match(/(?:git@(?![\w\.]+@)|https:\/{2}|http:\/{2})([\w\.@]+)[\/:]([\w,\-,\_]+)\/([\w,\-,\_]+)(?:\.git)?\/?/);

        // Match 1: Domain, Match 2: User Group3: Repo
        if (genericMatch) {
            return getGenericInfo(url, genericMatch, results);
        }

        return results;

    };

    const sendToIrc = (results) => {
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

    // Handler
    const listener = (to, from, text, message, is) => {
        // Check to see if the user is ignored from url listening, good for bots that repete
        if (_.includes(userIgnore, from)) return;

        // Get Urls
        let urls = helpers.ExtractUrls(text);

        // Input does not contain urls
        if (!urls) return;

        // Url Processing chain
        _(urls)
            // We do not deal with FTP
            .filter(url => !url.startsWith('ftp'))
            .each(url => {
                let isCached = resultsCache.has(url);
                let chain = isCached ? startCachedChain : startChain;
                chain(url, to, from, text, message, is)
                    .then(results => {
                        // We are cached so we do not need to grab this data again
                        if (results.isCached) return results;
                        // Grab meta data
                        return getTitle(results) // Get title
                            .then(results => getShorten(results)) // Grab URL Meta data based on site
                            // Grab URL Meta data based on site
                            .then(results => matcher(results))
                    })
                    // Report back to IRC, got to pass through say for now
                    .then(results => sendToIrc(results))
                    // Log To Database
                    .then(results => sendToDb(results))
                    // Send to Pusher
                    .then(results => sendToPusher(results))
                    // End chain
                    .then(results => endChain(results))
                    // Catch Errors
                    .catch(err => {
                        conLogger('Error in URL Listener chain:', 'error');
                        console.dir(err);
                    });
            });
    };

    // List for urls
    app.Listeners.set('url-listener', {
        desc: 'Listen for URLS',
        call: listener
    });

    // Clear cache every hour
    const cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 30;
    const clean = scheduler.schedule('urlResultCache', cronTime, () => {
        conLogger('Clearing The Url Result Cache', 'info');
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
