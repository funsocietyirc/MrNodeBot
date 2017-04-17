'use strict';
const endPoint = 'http://thebulletin.org/timeline';

const request = require('request');
const extend = require('extend');
const cheerio = require('cheerio');

const midnight = new Date(2000, 0, 0, 0, 0, 0, 0);

const toTime = mins =>
  new Date(midnight.getTime() + mins * -60000);

const pad = (min, input) => {
  const out = input + ''
  while (out.length < min)
    out = '0' + out
  return out
}

/**
 * Minutes to midnight.
 */
const conf = {
  source: endPoint,
  selector: '.view-content .node-title',
  title: /(?:(\d+)|(one|two|three|four|five|six|seven|eight|nine)(.*?half)) minutes to midnight/i
};

/**
 * Request the current minutes to midnight feed.
 *
 * Also contains a bunch of unrelated other posts.
 */
const _request = () => new Promise((resolve, reject) =>
  request(conf.source, function(error, response, body) {
    if (error)
      return reject(err);
    if (response.statusCode !== 200)
      return reject("Unexpected status code")
    return resolve(body)
  }));


const dateToString = (d) =>
  pad(2, d.getHours() - 12) +
  ':' + pad(2, d.getMinutes()) +
  (d.getSeconds() ? ':' + pad(2, d.getSeconds()) : '') +
  ' PM';

const numberStringToInt = value => {
  switch (value.toLowerCase()) {
    case 'one':
      return 1;
    case 'two':
      return 2;
    case 'three':
      return 3;
    case 'four':
      return 4;
    case 'five':
      return 5;
    case 'six':
      return 6;
    case 'seven':
      return 7;
    case 'eight':
      return 8;
    case 'nine':
      return 9;
  }
  return NaN;
};

const _extract = data =>
  new Promise((resolve, reject) => {
    const $ = cheerio.load(data);
    const nodes = $(conf.selector)
      .map(function() {
        return $(this).text()
      })
      .get();

    for (const node of nodes) {
      const result = node.match(conf.title);
      if (result) {
        if (!isNaN(result[1])) return resolve(parseInt(result[1]));
        if (result[2]) {
          const whole = numberStringToInt(result[2]);
          if (!isNaN(whole)) return resolve(whole + 0.5);
        }
      }
    }
    reject("No result found");
  });

const M2M = () => _request()
  .then(_extract)
  .then(x => dateToString(toTime(x)));


module.exports = M2M;
