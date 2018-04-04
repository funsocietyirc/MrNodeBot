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
                console.log(nearestNeighbor);
                console.log(probability);
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
