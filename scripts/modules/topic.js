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
                app.say(to, `The Topic history has been private messaged to you ${from}`);
                let count = 0;
                results.each(result => {
                    app.say(from, `[${count}]: ${result.attributes.topic} | ${result.attributes.nick} on ${result.attributes.timestamp} `);
                    count = count + 1;
                });
            });
    };
    app.Commands.set('topics', {
        desc: '[channel] get the last 5 topics',
        access: app.Config.accessLevels.identified,
        call: topics
    });

    const getTopics = (channel, limit) => topicsModel.query(qb => {
        qb.where('channel', channel).orderBy('timestamp', 'desc');
        if (limit) {
            qb.limit(limit);
        }
        qb.select(['topic'])
    }).fetchAll();

    // Revert to the last known topic
    const revertTopic = (to, from, text, message) => {
        getTopics(to, 2)
            .then(results => {
                if (results.length < 2) {
                    app.say(to, 'There is not enough data available for this channel');
                    return;
                }
                app.say(to, `Attempting to revert the topic as per your request ${from}`);
                app._ircClient.send('topic', to, results.pluck('topic')[1]);
            });
    };
    app.Commands.set('topic-revert', {
        desc: 'Restore the topic in the active channel to its previous state',
        access: app.Config.accessLevels.admin,
        call: revertTopic
    });

    const appendTopic = (to, from, text, message) => {
        if (!message) {
            app.say(to, 'You need to give me something to work with here...');
            return;
        }
        getTopics(to, 1)
            .then(results => {
                if (!results.length) {
                    app.say(to, 'There is not topics available for this channel');
                    return;
                }
                app._ircClient.send('topic', to, `${results.pluck('topic')[0]} | ${text}`);
            });
    };
    app.Commands.set('topic-append', {
        desc: 'Append to the previous topic (in channel)',
        access: app.Config.accessLevels.admin,
        call: appendTopic
    });


};
