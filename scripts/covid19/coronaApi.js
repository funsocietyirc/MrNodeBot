const scriptInfo = {
    name: 'coronaVirusAPI',
    desc: 'Corona Virus API',
    createdBy: 'IronY',
};

const _ = require('lodash');
const gen = require('./_coronavirus');

module.exports = (app) => {
    /**
     * Covid19 Canada Numbers
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const covid19Canada = async (req, res) => {
        try {
            const results = await gen.covidCanadaResults();

            return res.json({
                status: 'success',
                data: results,
            })
        }
        catch (err) {
            return res.json({
                status: 'error',
                message: err.message || '',
            });
        }
    };

    /**
     * CoronaVirus API Handler
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    const covid19Stats = async (req, res) => {
        try {
            // Query Params
            const country = req.query.hasOwnProperty('country') ? req.query.country : null;
            const city = req.query.hasOwnProperty('city') ? req.query.city : null;

            const results = await gen.covid19StatsResults(country, city);

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
    app.webRoutes.associateRoute('api.covid19Stats', {
        handler: covid19Stats,
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
    const covid19 = async (req, res) => {
        try {
            // Query Params
            const country = req.query.hasOwnProperty('country') ? req.query.country : null;
            const city = req.query.hasOwnProperty('city') ? req.query.city : null;

            const results = await gen.covid19Results(country, city);

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

    // Remains for legacies purposes
    app.webRoutes.associateRoute('api.coronavirus-rt', {
        handler: covid19,
        desc: 'Coronavirus Realtime API',
        path: '/api/coronavirus-rt',
        verb: 'get',
    });

    app.webRoutes.associateRoute('api.covid19', {
        handler: covid19,
        desc: 'Coronavirus Realtime API',
        path: '/api/covid19',
        verb: 'get',
    });

    // Return the script info
    return scriptInfo;
};
