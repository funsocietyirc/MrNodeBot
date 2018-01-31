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

// Display a list of images in the Web Front end
module.exports = (app) => {
    // Bailout if we do not have database
    if (!Models.YouTubeLink || !apiKey) return scriptInfo;

    // Clean the DB of broken URLS
    const cleanYoutube = async (to, from, text, message) => {
        app.say(to, `I am now verifying my memory for any faulty moving pictures ${from}..`);
        try {
            const links = await Models.YouTubeLink.query(qb => qb.where('lastChecked', null).limit(100)).fetchAll();
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

            app.say(to, `A total of ${count} broken YouTube links were removed ${from}`);
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

    // Return the script info
    return scriptInfo;
};
