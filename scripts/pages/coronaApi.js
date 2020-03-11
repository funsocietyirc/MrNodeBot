const scriptInfo = {
    name: 'coronaVirusAPI',
    desc: 'Corona Virus API',
    createdBy: 'IronY',
};

const _ = require('lodash');
const gen = require('../covid19/_coronavirus');

module.exports = (app) => {

    /**
     * CoronaVirus API Handler
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const coronavirus = async (req, res) => {
        try {
            // Query Params
            const country = req.query.hasOwnProperty('country') ? req.query.country : null;
            const city = req.query.hasOwnProperty('city') ? req.query.city : null;

            const results = await gen.gen(country, city);

            if (!results || _.isEmpty(results)) {
                return res.json(({
                    status: 'error',
                    message: 'No Results found'
                }))
            }

            return res.json({
                status: 'success',
                data: results,
            });

        } catch (err) {
            return res.json({
                status: 'error',
                message: err.message || '',
            });
        }
    };
    app.WebRoutes.set('api.coronavirus', {
        handler: coronavirus,
        desc: 'Coronavirus API',
        path: '/api/coronavirus',
        verb: 'get',
    });

    /**
     * CoronaVirus Real Time API Handler
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const coronavirusRT = async (req, res) => {
        try {
            // Query Params
            const country = req.query.hasOwnProperty('country') ? req.query.country : null;
            const city = req.query.hasOwnProperty('city') ? req.query.city : null;

            const results = await gen.genRealtime(country, city);

            if (!results || _.isEmpty(results)) {
                return res.json(({
                    status: 'error',
                    message: 'No Results found'
                }))
            }

            return res.json({
                status: 'success',
                data: results,
            });
        } catch (err) {
            return res.json({
                status: 'error',
                message: err.message || '',
            });
        }
    };

    app.WebRoutes.set('api.coronavirus-rt', {
        handler: coronavirusRT,
        desc: 'Coronavirus Realtime API',
        path: '/api/coronavirus-rt',
        verb: 'get',
    });

    // Return the script info
    return scriptInfo;
};
