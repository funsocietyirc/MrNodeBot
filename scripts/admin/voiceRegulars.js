'use strict';
const scriptInfo = {
    name: 'Voice Regulars',
    file: 'voiceRegulars.js',
    desc: 'Voice users by participation',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');
const threshold = 50;

module.exports = app => {
    if (!app.Database || !Models.Logging) return scriptInfo;

    const voiceRegulars = (to, from, text, message) => {
        let txtArray = text.split(' ');
        let channel = null;
        let thresh = null;

        switch (txtArray.length) {
            case 1:
                channel = _.isEmpty(txtArray[0]) ? to : txtArray[0];
                thresh = threshold;
                break;
            case 2:
                channel = txtArray[0];
                thresh = txtArray[1] % 1 === 0 ? txtArray[1] : threshold;
                break
        }

        if (!app.isInChannel(channel)) {
            app.say(from, `I am not in the channel ${channel}`);
            return;
        }

        Models.Logging.query(qb => qb.where(clause =>
                    clause.where('to', 'like', channel)
                )
                .orderBy('id', 'desc')
            )
            .fetchAll()
            .then(results => {
                if (!app.isInChannel(channel) || !app._ircClient.isOpInChannel(channel)) {
                    app.say(from, `I am not an In or an Op in ${channel}`);
                    return;
                }
                let tCount = 1;
                _(results.toJSON())
                  .groupBy('from')
                  .filter((v,k) => app.isInChannel(channel, k) && !app._ircClient.isOpOrVoiceInChannel(channel, k))
                  .mapKeys(v => _.first(v).from)
                  .mapValues(v => v.length)
                  .each((count,nick) => {
                    if(count < thresh) return;
                    setTimeout(() => {
                        app._ircClient.send('mode', channel, '+v', nick);
                    }, 1000 * tCount);
                    tCount = tCount + 1;
                  });
            });
    };

    // Terminate the bot and the proc watcher that keeps it up
    app.Commands.set('voice-regulars', {
        desc: '[Channel?] [Threshold?] Voice the regulars in a channel',
        access: app.Config.accessLevels.admin,
        call: voiceRegulars
    });

    // Return the script info
    return scriptInfo;
};
