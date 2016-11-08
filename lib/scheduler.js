'use strict';
const _ = require('lodash');
const scheduler = require('node-schedule');
const logger = require('./logger');

const systemJobs = [];

const clear = () => {
  _.forEach(scheduler.scheduledJobs, job => {
      if (!_.includes(systemJobs, job.name)) {
          job.cancel();
      }
  });
};

// Schedule a job using the cron scheduler
const schedule = (name, time, callback, system) => {
    // Job already exists
    if (_.includes(scheduler.scheduledJobs, name)) {
        logger.warn(`Duplicate job ${name} for time ${time} not loaded`);
        return;
    }

    if(!_.isFunction(callback)) {
      logger.warn(`Command ${name} is missing a callback`);
      return;
    }

    // If this is a system job, keep track so we do not purge during reload
    if (system === true) {
        logger.info(`${name} has been identified as a system task`);
        systemJobs.push(name);
    }

    // Pass the new job to the scheulder
    scheduler.scheduleJob(name, time, callback);
};

// Export functions
module.exports =  {
  schedule,
  clear,
  RecurrenceRule: scheduler.RecurrenceRule
};
