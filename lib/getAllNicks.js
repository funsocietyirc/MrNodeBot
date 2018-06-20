const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');

const getAllNicks = async () => {
    // We can probably get a good sense of nicks from these two tables
    const aliasOldNicks = await Models.Alias.query(qb => qb.distinct('oldnick')).fetchAll();
    const aliasNewNicks = await Models.Alias.query(qb => qb.distinct('newnick')).fetchAll();
    const joinNicks = await Models.JoinLogging.query(qb => qb.distinct('nick')).fetchAll();
    const loggingNicks = await Models.Logging.query(qb => qb.distinct('from')).fetchAll();
    return _.uniq(
        _.merge(
            aliasOldNicks.pluck('oldnick'),
            aliasNewNicks.pluck('newnick'),
            joinNicks.pluck('nick'),
            loggingNicks.pluck('from'),
        )
    );
};

module.exports = getAllNicks;
