const scriptInfo = {
    name: 'Topic Utilities',
    desc: 'Utilities to view and manipulate the channel topic',
    createdBy: 'IronY',
};

const _ = require('lodash');
const Models = require('funsociety-bookshelf-model-loader');
const Moment = require('moment');
const logger = require('../../lib/logger');

// Used to break up topics
const divider = ' | ';
const lastXtopics = 20;

module.exports = app => {
    // Bailout if we do not have database
    if (!app.Database || !Models.Topics) return scriptInfo;

    /**
     * Get Topics
     * @param channel
     * @param limit
     * @returns {Promise|Promise<Collection>}
     */
    const getTopics = (channel, limit) => Models.Topics.query((qb) => {
        qb.where('channel', channel).orderBy('timestamp', 'desc');
        if (limit) qb.limit(limit);
        qb.select(['topic']);
    }).fetchAll();

    /**
     * Topics Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const topicsHandler = async (to, from, text) => {
        // Get Selected Channel
        const channel = text || to;
        // Do Work
        try {
            // Fetch Results
            const results = await Models.Topics.query(qb => qb
                .where('channel', 'like', channel)
                .orderBy('timestamp', 'desc')
                .limit(lastXtopics)
                .select(['topic', 'nick', 'timestamp']))
                .fetchAll();
            // No Results available
            if (_.isEmpty(results)) {
                app.say(to, `There is no data available for ${channel}`);
                return;
            }
            // Report back
            app.say(to, `The Topic history has been private messaged to you, ${from}`);
            _(results.toJSON())
                .filter(t => t.topic !== null && t.topic !== '')
                .each((result, index) =>
                    app.say(from, `[${index + 1}]: ${result.topic} | ${result.nick} ${Moment(result.timestamp).fromNow()}`));
        }
            // Log Error
        catch (err) {
            logger.error('Error in the topics command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong fetching the topic information, ${from}`);
        }
    };
    app.Commands.set('topics', {
        desc: `[channel] get the last ${lastXtopics} topics`,
        access: app.Config.accessLevels.identified,
        call: topicsHandler,
    });

    /**
     * Topic Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const topicHandler = async (to, from) => {
        if (!app._ircClient.isChannel(to)) {
            app.say(to, 'I am sorry but you are not a channel, so I assume the topic is you?');
            return;
        }

        const results = await getTopics(to, 1);

        // No Results available
        if (_.isEmpty(results)) {
            app.say(to, `There is no topics available for ${to}, ${from}`);
            return;
        }

        const topic = results.pluck('topic')[0];

        if (_.isEmpty(topic)) {
            app.say(to, `It seems the topic is empty for ${to}, ${from}`);
            return;
        }

        app.say(to, topic);
    };
    app.Commands.set('topic', {
        desc: 'Repost the current topic to a channel',
        access: app.Config.accessLevels.identified,
        call: topicHandler
    });

    /**
     * Topic Revert Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const topicRevertHandler = async (to, from) => {
        // Bot is unable to change topic
        if (!app._ircClient.canModifyTopic(to)) {
            app.say(to, `I am unable to change the topic in this channel, ${from}`);
            return;
        }
        // Do Work
        try {
            // Fetch results
            const results = await getTopics(to, 2);
            // Not Enough Arguments
            if (results.length < 2) {
                app.say(to, 'There is not enough data available for this channel');
                return;
            }
            // Report back
            app.say(to, `Attempting to revert the topic as per your request, ${from}`);
            app._ircClient.send('topic', to, results.pluck('topic')[1]);
        }
            // Log Error
        catch (err) {
            logger.error('Error in the revertTopic command', {
                message: error.message || '',
                stack: error.stack || '',
            });
            app.say(to, `Something went wrong trying to revert the topic, ${from}`);
        }
    };
    app.Commands.set('topic-revert', {
        desc: 'Restore the topic in the active channel to its previous state',
        access: app.Config.accessLevels.admin,
        call: topicRevertHandler,
    });

    /**
     * Topic Append Handler
     * @param to
     * @param from
     * @param text
     * @param message
     * @returns {Promise<void>}
     */
    const topicAppendHandler = async (to, from, text, message) => {
        // No Message Provided
        if (!message) {
            app.say(to, 'You need to give me something to work with here...');
            return;
        }
        // Bot does not have permission to modify topic
        if (!app._ircClient.canModifyTopic(to)) {
            app.say(to, `I am unable to change the topic in this channel, ${from}`);
            return;
        }
        // Do Work
        try {
            const results = await getTopics(to, 1);

            // No Results available
            if (_.isEmpty(results)) {
                app.say(to, 'There is no topics available for this channel');
                return;
            }

            const topic = results.pluck('topic')[0];
            const topicString = topic || '';
            const dividerstring = topic ? divider : '';

            app._ircClient.send('topic', to, `${topicString}${dividerstring}${text}`);
        }
            // Log error
        catch (err) {
            logger.error('Error in the appendTopic command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong trying to append the topic, ${from}`);
        }
    };
    app.Commands.set('topic-append', {
        desc: 'Append to the previous topic (in channel)',
        access: app.Config.accessLevels.admin,
        call: topicAppendHandler,
    });

    /**
     * Topic Subtract Handler
     * @param to
     * @param from
     * @param text
     * @returns {Promise<void>}
     */
    const topicSubtractHandler = async (to, from, text) => {
        // Bot is does not have permissions to modify topic
        if (!app._ircClient.canModifyTopic(to)) {
            app.say(to, `I am unable to change the topic in this channel, ${from}`);
            return;
        }

        try {
            // Fetch Results
            const results = await getTopics(to, 1);
            // No Results
            if (_.isEmpty(results)) {
                app.say(to, 'There are no topics available for this channel');
                return;
            }
            // Get First Topic
            const topic = results.pluck('topic')[0];
            // No topic
            if (!topic) {
                app.say(to, 'That is all she wrote, folks');
                return;
            }
            // Break into segments
            const topicSegments = topic.split(divider);
            // Remove selected segment
            if (!text) topicSegments.splice(-1, 1);
            else {
                const index = topicSegments.indexOf(text);
                if (index === -1) {
                    app.say(to, `I am not sure you are reading that correctly, ${from}`);
                    return;
                }
                topicSegments.splice(index, 1);
            }
            // Report back
            app._ircClient.send('topic', to, topicSegments.join(divider));
        }
            // Log Error
        catch (err) {
            logger.error('Error in the subtractTopic command', {
                message: error.message || '',
                stack: error.stack || '',
            });
            app.say(to, `Something went wrong subtracting the topic segment, ${from}`);
        }
    };
    app.Commands.set('topic-subtract', {
        desc: 'Remove a segment from the channels topic',
        access: app.Config.accessLevels.admin,
        call: topicSubtractHandler,
    });

    /**
     * Topics Segment Handler
     * @param to
     * @param from
     * @returns {Promise<void>}
     */
    const topicSegmentsHandler = async (to, from) => {
        try {
            // Fetch Results
            const results = await getTopics(to, 1);
            // No results
            if (_.isEmpty(results)) {
                app.say(to, 'There are no topics available for this channel');
                return;
            }
            // Get the first topic
            const topic = results.pluck('topic')[0];
            // No topic
            if (!topic) {
                app.say(to, `There is no topic data available for ${to}`);
                return;
            }
            // Split segments
            const topicSegments = topic.split(divider);
            // No Segments
            if (_.isEmpty(topicSegments)) {
                app.say(to, `There are no segments available for the topic in ${to}`);
                return;
            }
            // Report back
            app.say(to, `I have oh so personally delivered that information via private message, ${from}`);
            app.say(from, `Here are the topic segments for ${to}`);
            topicSegments.forEach((r, x) => app.say(from, `[${x + 1}] ${r}`));
        }
            // Log Error
        catch (err) {
            logger.error('Error in the topicSegments command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong fetching the topic segments, ${from}`);
        }
    };
    app.Commands.set('topic-segments', {
        desc: 'Get a list of the current topic segments',
        access: app.Config.accessLevels.identified,
        call: topicSegmentsHandler,
    });

    // Return the script info
    return scriptInfo;
};
