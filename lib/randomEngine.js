// https://www.npmjs.com/package/random-js
const { Random, MersenneTwister19937 } = require("random-js");
const random = new Random(MersenneTwister19937.autoSeed());
module.exports = random;

