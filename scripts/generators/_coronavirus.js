const rp = require('request-promise-native');

module.exports = async (region, province) => {
    try {
    } catch (err) {
        const error = new Error('Something went wrong getting information from John Hopkins');
        error.innerErr = err;
        throw error;
    }
};
