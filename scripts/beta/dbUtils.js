'use strict';
const scriptInfo = {
    name: 'Database Utilities',
    desc: 'Bot database administrative commands',
    createdBy: 'Dave Richer'
};



module.exports = app => {
    // No Database available
    if(!app.Database) return scriptInfo;

    const mergeNick = (to, from, text, message) => {
      [oldNick, newNick] = text.split(' ');
      // No Nicks specified
      if(!oldNick || !newNick) {
        app.say(to, `You must specify both an old and new nick`);
        return;
      }

      // Update Logging table
      if(Models.Logging) {
        Models.Logging.where('from', 'like', oldNick).update({
          from: newNick
        })
      }

    };

    // Change the bots nick
    app.Commands.set('db-merge-nick', {
        desc: '[oldnick] [newnick] Merge Nicks',
        access: app.Config.accessLevels.owner,
        call: mergeNick
    });

    // Return the script info
    return scriptInfo;
};
