const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const logger = require('../../lib/logger');
const config = require('../../config');
// Ignore URL logging for specific channels
const urlLoggerIgnore = config.features.urls.loggingIgnore || [];

module.exports = async (results) => {
    // Ignore
    const ignored = urlLoggerIgnore.some(hash => _.includes(hash, _.toLower(results.to)));

    // Gate
    if (!Models.Url || ignored) return results;

    const data = {
        url: results.url,
        to: results.to,
        from: results.from,
        title: results.title,
    };

    // If we have a google URL key
    if (!_.isUndefined(config.apiKeys.google) && _.isString(config.apiKeys.google) && !_.isEmpty(config.apiKeys.google))
    // And the threat array is not empty, record the link is malicious
    { data.threat = !_.isEmpty(results.threats); }

    try {
        // Crate the record
        const record = await Models.Url.create(data);

        // Assign the ID
        results.id = record.id;

        // Push delivered status
        results.delivered.push({
            protocol: 'urlDatabase',
            recordId: results.id,
            on: Date.now(),
        });

        // Log Youtube Video
        if (
            !_.isUndefined(results.youTube) &&
            !_.isUndefined(results.youTube.video)
        ) {

            // Create YouTube record
            const youTubeRecord = await Models.YouTubeLink.create({
                url: results.youTube.video.key,
                to: results.to,
                from: results.from,
                title: results.youTube.video.videoTitle,
                user: results.message.user,
                host: results.message.host,
                restrictions: results.youTube.video.restrictions,
                embeddable: results.youTube.video.embeddable,
            });

            // Push delivered status
            results.delivered.push({
                protocol: 'youTubeDatabase',
                recordId: youTubeRecord.id,
                on: Date.now(),
                id: record.id,
            });
        }

        return results;
    } catch (err) {
        logger.error('Error In the URL Listener logging function', {
            message: err.message || '',
            stack: err.stack || '',
        });
        return results;
    }
};
