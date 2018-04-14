const nn = require('nearest-neighbor');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');

module.exports = async (nick, channel) => {
    // No Database
    if (!Models.Logging) throw new Error('Database not available');
    // Invalid Arguments
    if (!nick) throw new Error('Nick is a required argument');
    if (!channel) throw new Error('Channel is a required argument');

    try {
        const results = await Models.Logging.query((qb) => {
            qb
                .where('to', channel)
                .distinct('from')
                .select('from');
        }).fetchAll();

        // No results
        if (!results.length) return {};

        return new Promise((res, rej) => {
            nn.findMostSimilar({
                from: nick,
            }, results.toJSON(), [
                { name: "from", measure: nn.comparisonMethods.word },
            ], function(nearestNeighbor, probability) {
                res({
                    nearestNeighbor,
                    probability,
                });
            });
        });
    } catch (err) {
        logger.error('Something went wrong in the _getCandidatePopularityRanking file', {
            message: err.message || '',
            stack: err.stack || '',
        });
        throw new Error('Something went wrong getting the ranking');
    }
};

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
