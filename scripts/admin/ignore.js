'use strict';

/**
  Manipulation of the Ignore list.
  Users on the mute list are not acknolwedged by the bot
  Commands: mute unmute Ignored
**/
module.exports = app => {
    const mute = (to, from, text, message) => {
        let textArray = text.split(' ');
        if (!Admins.contains(textArray[0].toLowerCase()) && !app.Ignore.contains(textArray[0].toLowerCase())) {
            app.say(to, `${textArray[0]} has been muted. May there be peace.`);
            app.Ignore.push(textArray[0].toLowerCase());
            storage.setItemSync('ignore', app.Ignore);
        } else {
            app.say(to, `${textArray[0].capFirst()} has either already been muted, or is an Administrator and is beyond my control`);
        }
    };

    const unmute = (to, from, text, message) => {
        let textArray = text.split(' ');
        if (!textArray[0]) {
            app.say(to, 'You need to specify a user');
        } else {
            if (app.Ignore.contains(textArray[0].toLowerCase())) {
                app.say(to, `${textArray[0]} has been unmuted`);
                app.Ignore.splice(textArray.indexOf(textArray[0]));
                storage.setItemSync('ignore', app.Ignore);
            } else {
                app.say(to, `${textArray[0].capFirst()} is not on the mute list`);
            }
        }
    };

    const ignored = (to, from, text, message) => {
        app.say(to, '--- Ignore list ---');
        app.Ignore.forEach(function(user) {
            app.say(to, user.capFirst());
        });
        app.say(to, `For a total of: ${app.Ignore.length}`);
    };

    // Mute a user
    app.Commands.set('mute', {
        desc: 'Mute a user',
        access: app.Config.accessLevels.admin,
        call: mute
    });

    // Unmute a user
    app.Commands.set('unmute', {
        desc: 'Unmute a user',
        access: app.Config.accessLevels.admin,
        call: unmute
    });

    // Get a list of muted users
    app.Commands.set('ignored', {
        desc: 'The Ignore list of muted users',
        access: app.Config.accessLevels.admin,
        call: ignored
    });

};
