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
            case 0:
                channel = to;
                thresh = _.isNumber(parseInt(thresh)) ? thresh : threshold;
                break;
            case 1:
                channel = txtArray[0];
                thresh = _.isNumber(parseInt(thresh)) ? thresh : threshold;
                break;
            case 2:
                channel = txtArray[0];
                thresh = _.isNumber(parseInt(txtArray[1])) ? txtArray[1] : threshold;
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
                if (!app.isInChannel(channel)) {
                    app.say(from, `I am not in ${channel}`);
                    return;
                }
                if (!app._ircClient.isOpInChannel(channel)) {
                    app.say(from, `I am not an op in ${channel}`);
                    return;
                }
                let msgCount = [];
                let count = 1;
                let jResults = _(results.toJSON()).filter(v => app.isInChannel(channel, v.from) && !app._ircClient.isOpOrVoiceInChannel(channel, v.from));

                jResults.each(v => {
                    msgCount[v.from] = _.isUndefined(msgCount[v.from]) ? 1 : msgCount[v.from] + 1;
                });

                jResults.each(v => {
                    if (msgCount[v.from] < thresh)
                        return;
                    msgCount[v.from] = 0;
                    setTimeout(() => {
                        app._ircClient.send('mode', channel, '+v', v.from);
                    }, 1000 * count);
                    count = count + 1;
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
