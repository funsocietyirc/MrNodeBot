const scriptInfo = {
  name: 'Channel Token',
  file: 'channelToken.js',
  createdBy: 'Dave Richer'
};

const Models = require('bookshelf-model-loader');
const randToken = require('rand-token');
const tokenModel = Models.Token;

module.exports = app => {
    // Log nick changes in the alias table
    if (!app.Database && !Models.Token) {
        return;
    }

    // API End point, get a nick verified by channel token
    const getNickByTokenApi = (req, res) => {
      let error = {
          status: 'error',
          user: null
      };
      let token = req.body.token;
      if(!token) {
        return res.json(error);
      }
      tokenModel.query(qb => {
        qb
        .where('token',token)
        .select(['user','channel','timestamp']);
      })
      .fetch()
      .then(user => {
        if(!user) {
          return res.json(error);
        }
        res.json({
            status: 'success',
            user
        });
      });
    };
    // Register upload Handler
    app.WebRoutes.set('getNickByToken', {
        handler: getNickByTokenApi,
        desc: 'Handle File Upload',
        path: '/api/getNickByToken',
        name: 'getNickByToken',
        verb: 'post'
    });

    // Register a user to a token
    const registerToken = (to, from, text, message) => {
        // Only accept messages from channel
        if (to === from) {
            app.say(to, 'You must be in a channel to request a token');
            return;
        }

        let token = randToken.generate(8);

        tokenModel
            .query(qb => {
                qb
                    .where('user', from)
                    .where('channel', to);
            })
            .fetch()
            .then(result => {
                // If no previous tokens exist
                if (!result) {
                    tokenModel.create({
                            user: from,
                            channel: to,
                            token: token
                        })
                        .then(() => {
                            app.say(from, `Your new token for ${to} is ${token}`);
                        });
                }
                // If previous token exists
                else {
                    tokenModel
                        .where({
                            user: from,
                            channel: to
                        })
                        .save({
                            token: token
                        }, {
                            patch: true
                        })
                        .then(() => {
                            app.say(from, `Your new token for ${to} is ${token}`);
                        });
                }
            });
    };
    // Register token
    app.Commands.set('token', {
        desc: 'Get a unique token for uploading images to file',
        access: app.Config.accessLevels.identified,
        call: registerToken
    });

    return scriptInfo;
};
