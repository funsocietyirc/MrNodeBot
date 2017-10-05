'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const xray = require('x-ray')();

const helpers = require('../../helpers');
const logger = require('../../lib/logger');

// Check head for valid file size
const validDocument = async (url, userAgent) => rp({
    uri: url,
    resolveWithFullResponse: true,
    method: 'HEAD',
    headers: {
        // Fake user agent so we get HTML responses
        'User-Agent': userAgent,
        'Accept-Language': 'en',
    }
});

// Fetch the Document
const getDocument = async (url, userAgent) => rp({
    uri: url,
    resolveWithFullResponse: true,
    headers: {
        // Fake user agent so we get HTML responses
        'User-Agent': userAgent,
        'Accept-Language': 'en',
    }
});

const getDocuments = async (results, userAgent, maxLength) => {
    try {
        const documentCheck = await validDocument(results.url, userAgent);

        if (documentCheck.headers['content-length'] > maxLength || !documentCheck.headers.hasOwnProperty('content-type') || !_.includes(documentCheck.headers['content-type'], 'text/html')) {
            // TODO create a 'quite' mode on content-type discrepancies and content-length thresholds
            return Object.assign({}, results, {
                headers: documentCheck.headers,
                realUrl: documentCheck.request.uri.href,
                statusCode: (_.isUndefined(documentCheck) || _.isUndefined(documentCheck.statusCode)) ? 'No Status' : documentCheck.statusCode,
                title: `${documentCheck.headers['content-type'].toUpperCase()} Document, ${helpers.formatNumber(documentCheck.headers['content-length'] || 0)} bytes`,
                overLength: true,
            });
        }

        // Get the document
        const response = await getDocument(results.url, userAgent);

        // Append to the results Object
        const finalResults = Object.assign({}, results, {
            headers: response.headers,
            realUrl: response.request.uri.href,
            statusCode: (_.isUndefined(response) || _.isUndefined(response.statusCode)) ? 'No Status' : response.statusCode
        });

        // No Response body
        if (!response.body || !_.isString(response.body) || _.isEmpty(response.body.trim())) return finalResults;

        return new Promise((resolve, reject) => {
            xray(response.body, 'title')((err, title) => {
                if (err || !title) {
                    // Something actually went wrong
                    if (err) return reject(err);

                    return resolve(finalResults);
                }
                // Set the Page Title
                finalResults.title = helpers.StripNewLine(_.trim(title));
                resolve(finalResults);
            });
        })
            .catch(err => {
                finalResults.title = 'Invalid HTML document';
                return finalResults;
            });

    }
    catch (err) {
        logger.warn('Error in URL Get Document function', {
            message: err.message || '',
            stack: err.stack || '',
        });

        return Object.assign({}, results, {
            statusCode: (_.isUndefined(err) || _.isUndefined(err.response) || _.isUndefined(err.response.statusCode)) ? 'No Status' : err.response.statusCode,
            unreachable: true,
        });
    }
};

module.exports = getDocuments;