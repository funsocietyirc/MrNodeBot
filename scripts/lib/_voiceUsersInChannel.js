'use strict';
const _ = require('lodash');
const Models = require('bookshelf-model-loader');

module.exports = (channel, thresh, app) => new Promise((resolve, reject) => {
    if (!app.Database || !Models.Logging || !app.isInChannel(channel)) {
        resolve(`Something went wrong voicing users on ${channel}`)
        return;
    }
    return Models.Logging
        .query(qb => qb
            .where('to', 'like', channel)
            .orderBy('id', 'desc')
        )
        .fetchAll()
        .then(results => {
            if (!app.isInChannel(channel) || !app._ircClient.isOpInChannel(channel)) {
                resolve(`I am not in, or I am not an op in ${channel}`);
                return;
            }
            _(results.toJSON())
                .groupBy('from')
                .filter((v, k) => app.isInChannel(channel, k) && !app._ircClient.isOpOrVoiceInChannel(channel, k))
                .mapKeys(v => _.first(v).from)
                .mapValues(v => v.length)
                .map((count, nick) => {
                    if (count >= thresh) return nick
                })
                .chunk(4)
                .each((v, k) => {
                    setTimeout(() => app._ircClient.send('MODE', channel, '+' + 'v'.repeat(v.length), v[0], v[1] || '', v[2] || '', v[3] || ''), (1 + k) * 1000);
                });
            resolve(`Voiced users with a message count over ${thresh} users on ${channel}`);
        });
});
