'use strict'
// Wrap a HashMap object in a crypto MD5 gen to allow for reasonable length
// but unique keys.
const crypto = require('crypto');
const collection = new Map();
const getHash = text => crypto
    .createHash('md5')
    .update(text)
    .digest('hex');


module.exports = {
    clear: () => collection.clear(),
    delete: text => collection.delete(getHash(text)),
    entries: () => collection.entries(),
    set: (key, value) => collection.set(getHash(key), value),
    get: text => collection.get(getHash(text)),
    has: text => collection.has(getHash(text)),
    forEach: (callBack, thisArg) => collection.forEach(callBack, thisArg),
};
