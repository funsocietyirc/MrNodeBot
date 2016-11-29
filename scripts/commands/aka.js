'use strict';
const scriptInfo = {
    name: 'Also Known As',
    desc: 'Get information from the nick change table',
    createdBy: 'IronY'
};

const Models = require('bookshelf-model-loader');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Alias) {
        return;
    }

    // List known nicks for a given alias
    const aka = (to, from, text, message) => {
        if (!text) {
            app.say(to, `No one is no one is no one...`);
            return;
        }
        Models.Alias
            .query(qb => {
                qb
                    .distinct('newnick')
                    .where('oldnick', 'like', text)
                    .select('newnick');
            })
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    app.say(to, 'I have no data on that alias...');
                    return;
                }
                let nicks = results.pluck('newnick').join(' | ');
                app.say(to, `${text} is also known as: ${nicks}`);
            });
    };

    app.Commands.set('aka', {
        desc: '[alias] get known aliases',
        access: app.Config.accessLevels.identified,
        call: aka
    });

    // Return the script info
    return scriptInfo;
};
