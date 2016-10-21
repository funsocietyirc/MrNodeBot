'use strict';
const _ = require('lodash');
const scheduler = require('node-schedule');
const conLogger = require('./consoleLogger');

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
        conLogger(`Duplicate job ${name} for time ${time} not loaded`);
        return;
    }

    // If this is a system job, keep track so we do not purge during reload
    if (system === true) {
        systemJobs.push(name);
    }

    // Pass the new job to the scheulder
    scheduler.scheduleJob(name, time, callback);
};

// Export functions
module.exports =  {
  schedule, clear
};
