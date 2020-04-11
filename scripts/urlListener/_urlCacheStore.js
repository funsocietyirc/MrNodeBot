// Wrap a HashMap object in a crypto MD5 gen to allow for reasonable length
// but unique keys.
const hashCachedStore = require('../../lib/hashCachedStore');
module.exports = hashCachedStore();
