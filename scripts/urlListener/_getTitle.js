'use strict';

const _ = require('lodash');
const xray = require('x-ray')();
const helpers = require('../../helpers');

module.exports = results => new Promise((resolve, reject) => {

    xray(results.url, 'title')((err, title) => {
        if (err || !title) {
            resolve(results);
            return;
        }
        let formatedTitle = helpers.StripNewLine(_.trim(title));
        titleCache.set(results.url, formatedTitle);
        resolve(_.merge(results, {
            title: formatedTitle
        }));
    });
});
