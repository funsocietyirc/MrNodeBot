const scriptInfo = {
    name: 'Also Known As',
    desc: 'Get information from the nick change table',
    createdBy: 'IronY',
};
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');

module.exports = (app) => {
    // Log nick changes in the alias table
    if (!Models.Alias) return;

    const aka = async (to, from, text, message) => {
        if (!text) {
            app.say(to, 'No one is no one is no one...');
            return;
        }

        try {
            const results = await Models.Alias
                .query((qb) => {
                    qb
                        .distinct('newnick')
                        .where('oldnick', 'like', text)
                        .select('newnick');
                })
                .fetchAll();

            if (!results.length) {
                app.say(to, 'I have no data on that alias...');
                return;
            }

            const nicks = results.pluck('newnick').join(' | ');
            app.say(to, `${text} is also known as: ${nicks}`);
        } catch (err) {
            logger.error('Something went wrong in the aka command file', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, `Something went wrong fetching your aka data, ${from}`);
        }
    };

    // List known nicks for a given alias
    app.Commands.set('aka', {
        desc: '[alias] get known aliases',
        access: app.Config.accessLevels.identified,
        call: aka,
    });

    // Return the script info
    return scriptInfo;
};
