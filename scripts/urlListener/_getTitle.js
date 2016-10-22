'use strict';

const _ = require('lodash');
const xray = require('x-ray')();
const helpers = require('../../helpers');

module.exports = results => new Promise((resolve, reject) => {
    xray(results.url, 'title')((err, title) => {
        if (err || !title) {
            console.log('Error In XRAY Url chain:');
            console.dir(err);
            resolve(results);
            return;
        }
        let formatedTitle = helpers.StripNewLine(_.trim(title));
        resolve(_.merge(results, {
            title: formatedTitle
        }));
    });
});
