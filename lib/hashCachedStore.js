// Wrap a HashMap object in a crypto MD5 gen to allow for reasonable length
// but unique keys.
const crypto = require('crypto');

/**
 * Return A Map with Hashed wrapped keys
 * @returns {{entries: (function(): IterableIterator<[any, any]>), set: (function(*=, *=): Map<any, any>), forEach: (function(*=, *=): void), get: (function(*=): any), clear: (function(): void), has: (function(*=): boolean), delete: (function(*=): boolean)}}
 */
const hashCachedStore = () => {
    const collection = new Map();

    const getHash = text => crypto
        .createHash('md5')
        .update(text)
        .digest('hex');

    return {
        clear: () => collection.clear(),
        delete: text => collection.delete(getHash(text)),
        entries: () => collection.entries(),
        set: (key, value) => collection.set(getHash(key), value),
        get: text => collection.get(getHash(text)),
        has: text => collection.has(getHash(text)),
        forEach: (callBack, thisArg) => collection.forEach(callBack, thisArg),
    };
};

module.exports = hashCachedStore;
