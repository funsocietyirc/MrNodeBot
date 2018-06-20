const _ = require('lodash');
const nn = require('nearest-neighbor');
const getAllNicks = require('../../lib/getAllNicks');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

const nickBestGuess = async (nick) => {
    // Invalid Arguments
    if (!nick) throw new Error('Nick is a required argument');

    try {
        // Get a summation of most nicks in the system
        const allNicks = await getAllNicks();

        // No results
        if (!allNicks) return {};

        // Is it a exact match already?
        if (_.includes(allNicks, nick)) {
            return {
                nearestNeighbor: nick,
                probability: 1,
            };
        }

        // Format for Library
        const results = _.map(allNicks, result => Object.assign({
            from: result
        }));


        // Perform core logic
        return new Promise((res, rej) => {
            nn.findMostSimilar({
                from: nick,
            }, results, [
                { name: "from", measure: nn.comparisonMethods.word },
            ], function(nearestNeighbor, probability) {
                res({
                    nearestNeighbor,
                    probability,
                });
            });
        });
    } catch (err) {
        logger.error('Something went wrong in the _nickBestGuess file', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw err;
    }
};

module.exports = nickBestGuess;

// TODO: Going to need this to write custom comparator
// const tokenize = (string) => {
//     const tokens = [];
//     if (typeof string !== 'undefined' && string !== null) {
//         let i = 0;
//         while (i < string.length - 1) {
//             tokens.push(string.substr(i, 2).toLowerCase());
//             i++;
//         }
//     }
//     return tokens.sort();
// };
//
// const intersect = (a, b) => {
//     const result = [];
//     let ai = 0;
//     let bi = 0;
//     while (ai < a.length && bi < b.length) {
//         if (a[ai] < b[bi]) {
//             ai++;
//         } else if (a[ai] > b[bi]) {
//             bi++;
//         } else {
//             result.push(a[ai]);
//             ai++;
//             bi++;
//         }
//     }
//     return result;
// };
//
// nn.comparisonMethods.custom = (a, b) => {
//     const left = tokenize(a);
//     const right = tokenize(b);
//     return (2 * intersect(left, right).length) / (left.length + right.length);
// };
