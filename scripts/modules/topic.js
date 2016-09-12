'use strict';
const Models = require('bookshelf-model-loader');

module.exports = app => {
    const topicsModel = Models.Topics;

    // Bailout if we do not have database
    if (!app.Database || !topicsModel) {
        return;
    }

    // Toppic logging handler
    const loggingCmd = (channel, topic, nick, message) => {
        topicsModel.create({
                channel: channel,
                topic: topic,
                nick: nick
            })
            .catch(err => {
                console.log(err.message);
            });
    };
    app.OnTopic.set('topicDbLogger', {
        call: loggingCmd,
        desc: 'Log Topics',
        name: 'topicDbLogger'
    });

    // Get the last 5 topics
    const topics = (to, from, text, message) => {
        let channel = text || to;
        topicsModel.query(qb => {
                qb
                    .where('channel', 'like', channel)
                    .orderBy('timestamp', 'desc')
                    .limit(5)
                    .select(['topic', 'nick', 'timestamp']);
            })
            .fetchAll()
            .then(results => {
                if (!results.length) {
                    app.say(to, `There is no data available for ${channel}`);
                    return;
                }
                results.each(result => {
                    app.say(to, `The Topic history has been private messaged to you ${from}`);
                    app.say(from, `${result.attributes.topic} | ${result.attributes.nick} on ${result.attributes.timestamp} `);
                });
            });
    };
    app.Commands.set('topics', {
        desc: '[channel] get the last 5 topics',
        access: app.Config.accessLevels.identified,
        call: topics
    });

    // Revert to the last known topic
    const revertTopic = (to, from, text, message) => {
        topicsModel.query(qb => {
                qb
                    .where('channel', 'like', to)
                    .orderBy('timestamp', 'desc')
                    .limit(2)
                    .select(['topic']);
            })
            .fetchAll()
            .then(results => {
                app.say(to, `Attemting to revert the topic as per your request ${from}`);
                app._ircClient.send('topic', to, results.pluck('topic')[1]);
            });
    };

    app.Commands.set('topic-revert', {
        desc: 'revert-topic',
        access: app.Config.accessLevels.admin,
        call: revertTopic
    });
};
