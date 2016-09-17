'use strict';
const scriptInfo = {
    name: 'nick',
    file: 'nick.js',
    createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Alias) {
        return;
    }

    // Grab Model
    const aliasModel = Models.Alias;

    // Handler
    const nickChange = (oldnick, newnick, channels, message) => {
        // If we have a database connection, log
        aliasModel.create({
                oldnick: oldnick,
                newnick: newnick
            })
            .catch(err => {
                console.log(err.message);
            });
    };

    // Web front end
    const frontEnd = (req, res) => {
        aliasModel.fetchAll().then(results => {
            res.render('nickchanges', {
                results: results.toJSON(),
                moment: require('moment')
            });
        });
    };

    // List known nicks for a given alias
    const aka = (to,from,text,message) => {
      if(!text) {
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
        if(!results.length) {
          app.say(to,'I have no data on that alias...');
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

    // Listen and Log
    app.NickChanges.set('databaseLogging', {
        desc: 'Log Nick changes to the alias table',
        call: nickChange
    });

    // Web Front End
    app.WebRoutes.set('nickchanges', {
        handler: frontEnd,
        path: '/nickchanges',
        desc: 'Nick Changes',
        name: 'nickchanges'
    });

    // Return the script info
    return scriptInfo;
};
