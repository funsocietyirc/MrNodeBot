'use static';
const scriptInfo = {
    name: 'jeek',
    file: 'jeek.js',
    desc: 'Is Jeek alive?',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const xray = require('x-ray')();
const Models = require('bookshelf-model-loader');
const scheduler = require('../../lib/scheduler');
const randomEngine = require('../../lib/randomEngine');

let lastId = 0;
let motherQuotes = [];

module.exports = (app) => {
  if (!Models.Logging) return $scriptInfo;

    const getMother = () => {
      // Load Initial Mother responses from jeek
      Models.Logging.query(qb =>
        qb
        .select(['text','id'])
        .where('text', 'like', '%mother%')
        .andWhere('from', 'like', 'jeek')
        .andWhere('text', 'not like', 's/%')
        .andWhere('id','>',lastId)
      )
      .fetchAll()
      .then(results => {
        results.forEach(result => {
          motherQuotes.push(result.get('text'));
          lastId = result.get('id');
        });
      })
      .catch(err => {
        console.log('Error Loading jeek mother quotes quotes');
        console.dir(err);
      });
    };
    getMother();

    // Get More results
    let cronTime = new scheduler.RecurrenceRule();
    cronTime.minute = 30;
    scheduler.schedule('getMoreJeek', cronTime, getMother);

    // Check Jeeks Website to make sure he is still alive
    const jeek = (to, from, text, message) => xray('http://ishealive.jeek.net', ['h1'])((err, results) => {
        if (err || !results || !results[1]) {
            app.say(to, 'Something went wrong finding out if jeek is alive')
            return;
        }
        app.say(to, `Is Jeek Alive? ${results[1]}`);
    });

    const mother = (to, from, text, message) => {
      if(_.isEmpty(motherQuotes)) {
        app.say(to, 'I am afraid your mother is currently unavailble...');
        return;
      }
      app.say(to, randomEngine.pick(motherQuotes));
    };



    // Total Messages command
    app.Commands.set('jeek', {
        desc: 'Is Jeek Alive?',
        access: app.Config.accessLevels.identified,
        call: jeek
    });

    app.Commands.set('mother', {
        desc: 'Get a your mother line care of Jeek',
        access: app.Config.accessLevels.identified,
        call: mother
    })
    return scriptInfo;
};
