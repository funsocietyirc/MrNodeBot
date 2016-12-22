'use strict';
  // Get a Line(s) from FML
  // INPUT:
  //   count - The amount of lines to return
  // OUTPUT:
  //   an array of strings containing FML lines
const _ = require('lodash');
const xray = require('x-ray')();

module.exports = count => new Promise(
    (resolve, reject) => xray('http://www.fmylife.com/random', ['a.fmllink'])
    (
        (err, results) => {
            if (err) return reject(err);
            resolve(_.sampleSize(results, count || 1));
        }
    )
);
