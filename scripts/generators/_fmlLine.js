'use strict';
/*
  Get a Line(s) from FML
  INPUT:
    count - The amount of lines to return
  OUTPUT:
    an array of strings containing FML lines
*/
const _ = require('lodash');
const xray = require('x-ray')();

module.exports = count => new Promise((resolve, reject) => {
    count = count || 1;
    xray('http://www.fmylife.com/random', ['a.fmllink'])((err, results) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(_.sampleSize(results,count));
    });
});
