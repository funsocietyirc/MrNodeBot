'use strict';
const scriptInfo = {
    name: 'topic',
    file: 'topic.js',
    createdBy: 'Dave Richer'
};


const Models = require('bookshelf-model-loader');
const conLogger = require('../../lib/consoleLogger');

module.exports = app => {
    // Bailout if we do not have database
    if (!app.Database || !Models.Topics) {
        return;
    }
    // Toppic logging handler
    const loggingCmd = (channel, topic, nick, message) => {
        Models.Topics.query(qb => {
                qb.where('channel', 'like', channel)
                    .orderBy('id', 'desc')
                    .limit(1)
                    .select(['topic']);
            })
            .fetch()
            .then(lastTopic => {
                if (lastTopic && topic === lastTopic.attributes.topic) {
                    return;
                }
                Models.Topics.create({
                        channel: channel,
                        topic: topic,
                        nick: nick
                    })
                    .catch(err => {
                        conLogger(err, 'error');
                    });
            });
    };
    app.OnTopic.set('topicDbLogger', {
        call: loggingCmd,
        desc: 'Log Topics',
        name: 'topicDbLogger'
    });

    return scriptInfo;
};
