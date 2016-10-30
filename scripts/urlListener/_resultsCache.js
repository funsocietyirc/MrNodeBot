'use strict'
const crypto = require('crypto');

const getHash = text => crypto
  .createHash('md5')
  .update(text)
  .digest('hex');

const HashMap = require('hashmap');

const collection = new HashMap();

const set = text => collection.set(getHash(text));
const get = text => collection.get(getHash(text));
const has = text => collection.has(getHash(text));

module.exports = {
  get, set, has
};
