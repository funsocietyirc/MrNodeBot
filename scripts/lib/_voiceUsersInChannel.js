'use strict';

const _ = require('lodash');
const participation = require('./_channelParticipation');

module.exports = (channel, thresh, app, options) => new Promise((resolve, reject) => {
    if (!app.isInChannel(channel) || !app._ircClient.isOpInChannel(channel)) {
        reject(new Error(`I am not in, or I am not an op in ${channel}`));
        return;
    }

    options = _.isObject(options) ? options : {};
    options.threshold = thresh;

    return participation(channel, options)
        .then(results => {
            let actions = _.filter(results, v => app.isInChannel(channel, v.nick) && !app._ircClient.isOpOrVoiceInChannel(channel, v.nick));
            _(actions)
                .chunk(4)
                .each((v, k) => {
                    let args = ['MODE', channel, '+' + 'v'.repeat(v.length)].concat(_.map(v, 'nick'));
                    let callBack = () => app._ircClient.send.apply(null, args);
                    let callBackDelay = (1 + k) * 1000;
                    setTimeout(callBack, callBackDelay);
                })
        })
        .then(() => {
            resolve(`Voicing users with ${thresh} on ${channel}`);
        });
});
