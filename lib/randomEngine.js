'use strict';
// https://www.npmjs.com/package/random-js
const Random = require('random-js');
const random = new Random(Random.engines.mt19937().autoSeed());

module.exports = random;
