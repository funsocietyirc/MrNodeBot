'use strict';
module.exports = app => {
    // Bailout if we do not have database
    if(!app.Database ||  !app.Models.has('topics')) {
      return;
    }
    const topicsModel = app.Models.get('topics');

    // Handler
    const loggingCmd = (channel,topic,nick,message) => {
        new topicsModel({
            channel: channel,
            topic: topic,
            nick:nick
            })
            .save()
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
