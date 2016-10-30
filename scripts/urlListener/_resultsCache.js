'use strict'
const crypto = require('crypto');
const HashMap = require('hashmap');

const getHash = text => crypto
  .createHash('md5')
  .update(text)
  .digest('hex');

const collection = new HashMap();

module.exports = {
  set: (key, value) => collection.set(getHash(key), value),
  get: text => collection.get(getHash(text)),
  has: text => collection.has(getHash(text)),
  forEach: collection.forEach
};
