'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const xray = require('x-ray')();

const helpers = require('../../helpers');
const logger = require('../../lib/logger');

const userAgent = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

const getDocuments = async(results) => {
    try {

        // Get the document
        const response = await rp({
            uri: results.url,
            resolveWithFullResponse: true,
            headers: {
                // Fake user agent so we get HTML responses
                'User-Agent': userAgent
            }
        });

        const contentType = response.headers['content-type'];

        // Append to the results Object
        Object.assign(results, {
            headers: response.headers,
            realUrl: response.request.uri.href,
            statusCode: (_.isUndefined(response) || _.isUndefined(response.statusCode)) ? 'No Status' : response.statusCode
        });

        // No Content type available, return
        if (!contentType) return results;

        // We have valid HTML, return a XRay scrape
        if (_.includes(contentType, 'text/html')) {
            return new Promise((resolve,reject) => {
                xray(response.body, 'title')((err, title) => {
                    if (err || !title) {
                        // Something actually went wrong
                        if (err) logger.warn('Error in XRAY URL Chain', {
                            err
                        });
                        resolve(results);
                        return;
                    }
                    // Set the Page Title
                    results.title = helpers.StripNewLine(_.trim(title));
                    resolve(results);
                });
            });
        }

        // We do not have valid HTML
        results.title = `${contentType.toUpperCase()} Document`;
        return results;
    }
    catch (err) {
        logger.warn('Error in URL Get Document function', {
            message: err.message || '',
            stack: err.stack || '',
        });

        // Set status code
        results.statusCode = (_.isUndefined(err) || _.isUndefined(err.response) || _.isUndefined(err.response.statusCode)) ? 'No Status' : err.response.statusCode;

        // Set the unreachable flag
        results.unreachable = true;
        return results;
    }
};

module.exports = getDocuments;