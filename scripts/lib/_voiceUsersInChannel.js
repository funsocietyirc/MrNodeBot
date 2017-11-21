const _ = require('lodash');
const participation = require('./_channelParticipation');

const voiceUsersInChannel = async (channel, thresh, app, options) => {
    if (!app._ircClient.isInChannel(channel) || !app._ircClient.isOpInChannel(channel)) throw new Error(`I am not in, or I am not an op in ${channel}`);

    options = _.isObject(options) ? options : {};
    options.threshold = thresh;

    const results = await participation(channel, options);

    const actions = _.filter(results, v => app._ircClient.isInChannel(channel, v.nick) && !app._ircClient.isOpOrVoiceInChannel(channel, v.nick));
    _(actions)
        .chunk(4)
        .each((v, k) => {
            const args = ['MODE', channel, `+${'v'.repeat(v.length)}`].concat(_.map(v, 'nick'));
            const callBack = () => app._ircClient.send.apply(null, args);
            const callBackDelay = (1 + k) * 1000;
            setTimeout(callBack, callBackDelay);
        });

    return `Voicing users with ${thresh} on ${channel}`;
};

module.exports = voiceUsersInChannel;
