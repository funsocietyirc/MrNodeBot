const scriptInfo = {
    name: 'Youtube Utilities Module',
    desc: 'Youtube Links table management',
    createdBy: 'IronY',
};
const _ = require('lodash');
const rp = require('request-promise-native');
const logger = require('../../lib/logger');
const Models = require('funsociety-bookshelf-model-loader');
const apiKey = require('../../config').apiKeys.google;
const scheduler = require('../../lib/scheduler');

// Display a list of images in the Web Front end
module.exports = (app) => {
    // Bailout if we do not have database
    if (!Models.YouTubeLink || !apiKey) return scriptInfo;

    // Clean the DB of broken URLS
    const cleanYoutube = async (to, from, text, message) => {
        const unattended = !to || !from;
        if (!unattended) app.say(to, `I am now verifying my memory for any faulty moving pictures ${from}..`);
        else logger.info(`Running clean-youtube script`);

        try {
            // No records available
            const recordCount = await Models.YouTubeLink.count();
            if (!recordCount) {
                if (!unattended) app.say(to, `There is nothing to clean, ${from}`);
                return;
            }

            // This cycle is completed, there is no more new records to check, lets start from the beginning
            // const affectedRecordCount = await Models.YouTubeLink.query(qb => qb.whereNull('lastChecked')).count();
            // if (!affectedRecordCount) {
            //     await Models.YouTubeLink.query(qb => qb.whereNotNull('lastChecked')).save({
            //         lastChecked: null
            //     }, {
            //         method: 'update',
            //         patch: true
            //     });
            // }

            // Clean
            const links = await Models.YouTubeLink.query(qb => qb.whereNull('lastChecked').limit(50)).fetchAll();
            let count = 0;
            for (const link of links.models) {
                try {
                    const requestResults = await rp({
                        uri: 'https://www.googleapis.com/youtube/v3/videos',
                        qs: {
                            part: 'id',
                            id: link.get('url'),
                            key: apiKey,
                        },
                        json: true
                    });

                    if (!requestResults || _.isEmpty(requestResults.items)) {
                        logger.info(`I am deleting a broken youtube link ${link.get('url')} by ${link.get('from')} to ${link.get('to')} on ${link.get('timestamp')}`);
                        await link.destroy();
                        count++;
                        continue;
                    }

                    link.set('lastChecked', Models.Bookshelf.knex.fn.now());
                    await link.save();

                }
                catch (innerError) {
                    logger.error('Something went wrong cleaning YouTube links (during iteration)', {
                        message: innerError.message || '',
                        stack: innerError.stack || '',
                    });
                }
            }


            if (!unattended) app.say(to, `A total of ${count} broken YouTube links were removed, ${from}`);
            else logger.info(`A total of ${count} broken YouTube links were removed`);
        }
        catch (err) {
            app.say(to, `Something went wrong in my memory bank, I cannot compute ${from}..`);
            logger.error('Something went wrong cleaning YouTube links', {
                message: err.message || '',
                stack: err.stack || '',
            });
        }

    };

    // Command to clean URLS
    app.Commands.set('clean-youtube-links', {
        desc: 'clean YouTube links',
        access: app.Config.accessLevels.owner,
        call: cleanYoutube,
    });

    const cronTime = new scheduler.RecurrenceRule();
    cronTime.second = 0;
    cronTime.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    scheduler.schedule('cleanYoutube', cronTime, cleanYoutube);

    // Return the script info
    return scriptInfo;
};
