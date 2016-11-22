'use strict';
const scriptInfo = {
    name: 'usageApi',
    desc: 'The Usage Express API',
    createdBy: 'Dave Richer'
};

const _ = require('lodash');
const logger = require('../../lib/logger');
const Models = require('bookshelf-model-loader');
const Moment = require('moment');
const gen = require('../generators/_getUsageOverTime');

module.exports = app => {
    // No Database
    if (!Models.Logging) return scriptInfo;

    const getUsageOverTime = (req,res) => {
      gen(req.params.channel, req.params.nick)
        .then(results => {
          if (!results) {
              res.json({
                  message: 'No results available',
                  status: 'error',
                  results: [],
              });
              return;
          }

          results.status = 'success';
          res.json(results);
        })
        .catch(err => {
            logger.error('Error fetching usage stats', {
                err
            });
            res.json({
                status: 'error',
                results: []
            });
        });
    };

    // Subscribe to web service
    app.WebRoutes.set('api.usage.overtime', {
        handler: getUsageOverTime,
        desc: 'Get Usage Over Time',
        path: '/api/usage/overtime/:channel/:nick?',
        name: 'api.usage.overtime',
        verb: 'get'
    });

    return scriptInfo;
};
