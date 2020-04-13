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
module.exports = app => {
    // Bailout if we do not have database
    if (!Models.YouTubeLink || !apiKey) return scriptInfo;

    /**
     * Clean Youtube Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const cleanYoutubeHandler = async (to, from) => {
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
                        await link.destroy({
                            required: false,
                        });
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

            if (!unattended) {
                app.say(to, `A total of ${count} broken YouTube links were removed, ${from}`);
            }
            else if (count) {
                logger.info(`A total of ${count} broken YouTube links were removed`);
            }
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
        call: cleanYoutubeHandler,
    });

    const cronTime = new scheduler.RecurrenceRule();
    cronTime.second = 0;
    cronTime.minute = 0;
    cronTime.hour = [0, 4, 8, 12, 16, 20];
    scheduler.schedule('cleanYoutube', cronTime, cleanYoutubeHandler);

    // Return the script info
    return scriptInfo;
};
