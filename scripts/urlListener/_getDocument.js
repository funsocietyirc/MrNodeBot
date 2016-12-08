'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const xray = require('x-ray')();
const helpers = require('../../helpers');
const logger = require('../../lib/logger');

module.exports = results => new Promise((resolve, reject) => rp({
        uri: results.url,
        resolveWithFullResponse: true,
        headers: {
            // Fake user agent so we get HTML responses
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        }
    })
    .then(response => {
        let contentType = response.headers['content-type'];
        // Hold on to the HTTP Headers
        results.headers = response.headers;
        // Hold on to the actual URL after all redirects
        results.realUrl = response.request.uri.href;
        // Hold on to the response status code
        results.statusCode = _.isUndefined(response) || _.isUndefined(response.statusCode) ? 'No Status' : response.statusCode;
        // We did not recieve enough information from the request
        if (!contentType) return resolve(results);

        // We have valid HTML
        if (_.includes(contentType, 'text/html')) {
            return xray(response.body, 'title')((err, title) => {
                if (err || !title) {
                    // Something actually went wrong
                    if (err) logger.warn('Error in XRAY URL Chain', {
                        err
                    });
                    resolve(results);
                    return;
                }
                results.title = helpers.StripNewLine(_.trim(title));
                return resolve(results);
            });
        }

        // We do not have valid HTML
        results.title = `${contentType.toUpperCase()} Document`;
        resolve(results);
    })
    .catch(err => {
        logger.warn('Error in URL Get Document function', {
            err
        });
        // Set status code
        results.statusCode = _.isUndefineed(err)_ || .isUndefined(err.response) || _.isUndefined(err.response.statusCode) ? 'No Status' : err.response.statusCode;

        // Set the unreachable flag
        results.unreachable = true;
        resolve(results);
    })
);
