const _ = require('lodash');
const rp = require('request-promise-native');
const xray = require('x-ray')();

const helpers = require('../../helpers');
const logger = require('../../lib/logger');

// Check head for valid file size
const performHEADRequest = async (url, userAgent) => rp({
    uri: url,
    resolveWithFullResponse: true,
    method: 'HEAD',
    headers: {
        // Fake user agent so we get HTML responses
        'User-Agent': userAgent,
        'Accept-Language': 'en',
    },
});

// Fetch the Document
const preformGetRequest = async (url, userAgent) => rp({
    uri: url,
    resolveWithFullResponse: true,
    headers: {
        // Fake user agent so we get HTML responses
        'User-Agent': userAgent,
        'Accept-Language': 'en',
    },
});

const processDocument = async (results, userAgent, maxLength) => {
    try {
        const documentCheck = await performHEADRequest(results.url, userAgent);

        // TODO Sometimes head requests do not work
        if (
            documentCheck.headers['content-length'] > maxLength ||
            !documentCheck.headers.hasOwnProperty('content-type') ||
            !_.isString(documentCheck.headers['content-type']) ||
            (
                !_.includes(documentCheck.headers['content-type'], 'text/html') &&
                !_.includes(documentCheck.headers['content-type'], 'application/json')
            )
        ) {
            // TODO create a 'quite' mode on content-type discrepancies and content-length thresholds
            const headersNormalized = ( _.has(documentCheck, 'headers') && _.has(documentCheck.headers, 'content-type') && _.isString(documentCheck.headers['content-type'])) ?
                documentCheck.headers['content-type'].toUpperCase() : 'Unknown';

            const contentLengthNormalized = ( _.has(documentCheck, 'headers') && _.has(documentCheck.headers, 'content-length') && _.isString(documentCheck.headers['content-type'])) ?
                helpers.formatNumber(documentCheck.headers['content-length']) : 'Unknown';

            return Object.assign({}, results, {
                headers: documentCheck.headers,
                realUrl: documentCheck.request.uri.href,
                statusCode: (_.isUndefined(documentCheck) || _.isUndefined(documentCheck.statusCode)) ? 'No Status' : documentCheck.statusCode,
                title: `${headersNormalized} Document, ${contentLengthNormalized} bytes`,
                overLength: true,
            });
        }

        try {
            // Get the document
            const response = await preformGetRequest(results.url, userAgent);

            // Append to the results Object
            const finalResults = Object.assign({}, results, {
                headers: response.headers,
                realUrl: response.request.uri.href,
                statusCode: (_.isUndefined(response) || _.isUndefined(response.statusCode)) ? 'No Status' : response.statusCode,
            });

            // No Response body
            if (!response.body || !_.isString(response.body) || _.isEmpty(response.body.trim())) return finalResults;

            if (_.includes(documentCheck.headers['content-type'], 'text/html')) {
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
                    .catch(() => {
                        finalResults.title = 'Invalid HTML document';
                        return finalResults;
                    });
            } else if (_.includes(documentCheck.headers['content-type'], 'application/json')) {
                try {
                    // If invalid, a exception will be thrown
                    JSON.parse(response.body);
                    return Object.assign({}, results, {
                        headers: documentCheck.headers,
                        realUrl: documentCheck.request.uri.href,
                        statusCode: (_.isUndefined(documentCheck) || _.isUndefined(documentCheck.statusCode)) ? 'No Status' : documentCheck.statusCode,
                        title: `${documentCheck.headers['content-type'].toUpperCase()} Document, ${helpers.formatNumber(documentCheck.headers['content-length'] || 0)} bytes - (${helpers.StripNewLine(_.truncate(response.body.replace(/\s\s+/g, ' '), 30, '...'))})`,
                        overLength: true,
                    });
                }
                catch (err) {
                    return Object.assign({}, results, {
                        headers: documentCheck.headers,
                        realUrl: documentCheck.request.uri.href,
                        statusCode: (_.isUndefined(documentCheck) || _.isUndefined(documentCheck.statusCode)) ? 'No Status' : documentCheck.statusCode,
                        title: `${documentCheck.headers['content-type'].toUpperCase()} Document, ${helpers.formatNumber(documentCheck.headers['content-length'] || 0)} bytes - (Invalid JSON Document)`,
                        overLength: true,
                    });
                }
            }

            return finalResults;
        } catch (err) {
            logger.warn('Error in URL Get Document function', {
                message: err.message || '',
                stack: err.stack || '',
            });

            return Object.assign({}, results, {
                statusCode: (_.isUndefined(err) || _.isUndefined(err.response) || _.isUndefined(err.response.statusCode)) ? 'No Status' : err.response.statusCode,
                unreachable: true,
            });
        }
    } catch (err) {
        if(err.statusCode === 302 && err.options.uri.includes('www.youtube.com')) {
            return Object.assign({}, results, {
                headers: err.headers,
                realUrl: err.options.uri,
                statusCode: '302',
                title: `Inappropriate or offensive YouTube content`,
                overLength: true,
            });
        }
        throw err;
    }

};

module.exports = processDocument;
