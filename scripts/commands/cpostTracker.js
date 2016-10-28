'use strict'
const scriptInfo = {
  name: 'Canada Post Commands',
  file: 'cpost.js',
  desc: 'Get things like package tracking and postal code suggestions',
  createdBy: 'Dave Richer'
};

const trackingUrl = 'https://www.canadapost.ca/cpotools/apps/track/personal/findByTrackNumber?LOCALE=en&trackingNumber=';
const _ = require('lodash');
const xray = require('x-ray')();

module.exports = app => {
    const cpost = (to, from, text, message) => {
        if (_.isEmpty(text.trim())) {
            app.say(to, `You need to provide a tracking number`);
            return;
        }
        let [id] = text.split(' ');

        xray(trackingUrl + id, 'html', [{
          status: 'div.status_txt_holder', expected: 'h6'
        }])((err, results) => {
            if (err || !results) {
                console.log('Error In Canada Post Tracking:');
                console.dir(err);
                app.say(to, 'Something went wrong tracking your package');
                return;
            }
            app.say(to, `Your Package is currently ${results[0].status}. ${results[0].expected}`);
        });
    };

    app.Commands.set('cpost', {
        desc: '[ID] Track a Canada Post Package',
        access: app.Config.accessLevels.identified,
        call: cpost
    });
};
