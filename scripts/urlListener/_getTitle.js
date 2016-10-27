'use strict';

const _ = require('lodash');
const xray = require('x-ray')();
const helpers = require('../../helpers');
const regex = /^.*(png|jpg|jpeg|gif)$/i;

module.exports = results => new Promise((resolve, reject) => {
    xray(results.url, 'title')((err, title) => {
        if (err || !title) {
            let match = results.url.match(regex);
            if(match && match[0] && match[1]) {
              resolve(_.merge(results, {
                  title: `${match[1].toUpperCase()} Image`
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
            title: formatedTitle
        }));
    });
});
