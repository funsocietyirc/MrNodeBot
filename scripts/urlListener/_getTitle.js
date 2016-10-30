'use strict';

const _ = require('lodash');
const xray = require('x-ray')();
const helpers = require('../../helpers');
const imageRegex = /^.*(png|jpg|jpeg|gif|mp4|avi|mpeg|gifv)$/i;
const rp = require('request-promise-native');

module.exports = results => new Promise((resolve, reject) => rp({
        uri: results.url,
        resolveWithFullResponse: true
    })
    .then(response => xray(response.body, 'title')((err, title) => {
        if (err || !title) {
            let match = results.url.match(imageRegex);
            if (match && match[0] && match[1]) {
                resolve(_.merge(results, {
                    title: `${match[1].toUpperCase()} Media`,
                    realUrl: response.request.uri.href
                }));
                return;
            }
            console.log('Error In XRAY Url chain:');
            console.dir(err);
            resolve(results);
            return;
        }
        let formatedTitle = helpers.StripNewLine(_.trim(title));
        resolve(_.merge(results, {
            title: formatedTitle,
            realUrl: response.request.uri.href,
        }));
    }))
    .catch(() => resolve(_.merge(results, {
        unreachable: true
    }))));
