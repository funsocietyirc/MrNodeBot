const logger = require('../../lib/logger');
const _ = require('lodash');
const rp = require('request-promise-native');
const endPoint = 'https://www150.statcan.gc.ca/t1/tbl1/#?pid=13100766&file=1310076601-eng.csv';

const scriptInfo = {
    name: 'Canada Case Data Covid 19',
    desc: 'Canada Case Data Covid 19',
    createdBy: 'IronY',
};

module.exports = app => {

    // Request the current minutes to midnight feed.
    const _request = () => {
        return rp({uri: endPoint, json: false});
    };

    const statsCanTest = async (to, from, text, message) => {
        try {
            const results = await _request();
            console.dir(results);
        } catch (err) {
            logger.error('Error in the Stats Can Test Command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            console.dir(err);
            app.say(to, `Something went wrong with the statscanada command, ${from}`);
        }
    };

    app.Commands.set('covid19-statscantest', {
        desc: 'test',
        access: app.Config.accessLevels.identified,
        call: statsCanTest,
    });

    return scriptInfo;
};
