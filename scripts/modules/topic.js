'use strict';
const Models = require('bookshelf-model-loader');

module.exports = app => {
const topicsModel = Models.Topics;

    // Bailout if we do not have database
    if(!app.Database ||  !topicsModel) {
      return;
    }

    // Toppic logging handler
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
    app.OnTopic.set('topicDbLogger', {
        call: loggingCmd,
        desc: 'Log Topics',
        name: 'topicDbLogger'
    });

    // Topic handler
    const topics = (to,from,text,message) => {
      let channel = text || to;
      topicsModel.query(qb => {
        qb
        .where('channel','like',channel)
        .orderBy('timestamp','desc')
        .limit(5)
        .select(['topic','nick','timestamp']);
      })
      .fetchAll()
      .then(results => {
        if(!results.length) {
          app.say(to, `There is no data available for ${channel}`);
          return;
        }
        results.each(result => {
          app.say(to, `${result.attributes.topic} | ${result.attributes.nick} on ${result.attributes.timestamp} `);
        });
      });
    };

    app.Commands.set('topics', {
        desc: '[channel] get the last 5 topics',
        access: app.Config.accessLevels.identified,
        call: topics
    });

};
