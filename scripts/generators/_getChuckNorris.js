'use strict';
const _ = require('lodash');
const rp = require('request-promise-native');
const endPoint = 'https://api.chucknorris.io/jokes/random';

module.exports = async(amount) => {
  try {
    const results = await rp({uri: endPoint, json: true});

    if (!results || !results.value || !_.isString(results.value))
      throw new Error();

    return results.value;

  } catch (err) {
    throw new Error('Seems Chuck Norris broke his own website with a refresh');
  }
};
