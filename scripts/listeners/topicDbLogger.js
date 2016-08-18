'use strict';
const Models = require('bookshelf-model-loader');

module.exports = app => {
    // Bailout if we do not have database
    if(!app.Database ||  !Models.Topics) {
      return;
    }
    const topicsModel = Models.Topics;

    // Handler
    const loggingCmd = (channel,topic,nick,message) => {
        topicsModel.create({
            channel: channel,
            topic: topic,
            nick:nick
            })
            .catch(err => {
                console.log(err.message);
            });
    };

    // Add the listener
    app.OnTopic.set('topicDbLogger', {
        call: loggingCmd,
        desc: 'Log Topics',
        name: 'topicDbLogger'
    });
};
