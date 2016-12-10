'use strict';
const _ = require('lodash');
const t = require('./localize');
const scheduler = require('node-schedule');
const logger = require('./logger');

// Hold on to the system jobs
const systemJobs = [];

// Clear the Scheduler
const clear = () => _.forEach(scheduler.scheduledJobs, job => {
    if (!_.includes(systemJobs, job.name)) {
        job.cancel();
    }
});

// Schedule a job using the cron scheduler
const schedule = (name, time, callback, system) => {
    // Job already exists
    if (_.includes(scheduler.scheduledJobs, name)) {
        logger.warn(t('libraries:scheduler.duplicate', {
            name,
            time
        }));
        return;
    }
    // Callback is missing
    if (!_.isFunction(callback)) {
        logger.warn(t('libraries:scheduler.missingCallback', {
            name
        }));
        return;
    }

    // If this is a system job, keep track so we do not purge during reload
    if (system === true) {
        logger.info(t('libraries:scheduler.systemTask', {
            name
        }));
        systemJobs.push(name);
    }

    // Pass the new job to the scheulder
    scheduler.scheduleJob(name, time, callback);
};

// Export functions
module.exports = {
    schedule,
    clear,
    RecurrenceRule: scheduler.RecurrenceRule,
    jobs: scheduler.scheduledJobs,
    Range: scheduler.Range
};
