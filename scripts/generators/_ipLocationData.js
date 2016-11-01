'use strict';

const rp = require('request-promise-native');

/**
 Return GEO IP Data in the following format
     {
     ip: '',
     country_code: '',
     country_name: '',
     region_code: '',
     region_name: '',
     city: '',
     zip_code: '',
     time_zone: '',
     latitude: 0,
     longitude: 0,
     metro_code: 0
   }

 If the host is invalid, and the request fails, a empty object will be returned
**/

module.exports = host => new Promise((resolve, reject) => {
    if (!host) {
        reject(new Error('No host was provided.'));
        return;
    }
    resolve(rp({
            uri: `https://freegeoip.net/json/${host}`,
            json: true,
        })
        .catch(err => new Object())
    );
});
