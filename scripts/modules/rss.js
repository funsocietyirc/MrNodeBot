'use strict';
const scriptInfo = {
    name: 'rss',
    desc: 'RSS Feed System (Database Related)',
    createdBy: 'IronY'
};

const _ = require('lodash');
const logger = require('../../lib/logger');
const getShort = require('../lib/_getShortService')();
const extractUrls = require('../../lib/extractUrls');

const Models = require('bookshelf-model-loader');
const Moment = require('moment');
const RssFeedEmitter = require('funsociety-irc-rss-feed-emitter');

module.exports = app => {
    // No Database available
    if (!Models.RssFeed || !Models.RssChannelSubscription) return scriptInfo;

    // Initial RSS Feed Loader
    const feeder = new RssFeedEmitter({userAgent: 'MrNodeBot'});

    Models.RssFeed.fetchAll().then(feeds => feeds.forEach(feed => feeder.add({
        url: feed.attributes.link,
        refresh: 2000,
    })));

    // New Item Event Emitter
    feeder.on('new-item-max', function (item, url) {
        (async function () {
            try {
                // Grab Subscriptions
                const feed = await Models.RssFeed.where('link', url).fetch({
                    withRelated: ['subscriptions']
                });

                const subscriptions = feed.related('subscriptions');


                const link = _.isString(item.link) ? await getShort(item.link) : '';

                const date = item.date || item.pubDate;
                const dateAgo = date ? Moment(date).fromNow() : 'No Date';

                // Send back to IRC
                subscriptions.forEach(subscription => {
                    if (app._ircClient.isInChannel(subscription.attributes.channel, app.nick))
                        app.say(subscription.attributes.channel, `${feed.attributes.name} RSS -> ${item.author} -> ${item.title} -> ${link} -> ${dateAgo}`)
                });
            }
            catch (err) {
                logger.error('Something went wrong sending a RSS new-item to the channel', {
                    message: err.message || '',
                    stack: err.stack || '',
                });
            }
        }());
    });

    const unsubscribe = async (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(to, `I am sorry ${from}, I require a RSS feed ID to unsubscribe to a feed`);
            return;
        }

        const id = parseInt(text.split(' ')[0]);

        if (!_.isSafeInteger(id)) {
            app.say(to, `I am sorry ${from}, the ID you gave me is not a numeric value`);
            return;
        }

        try {
            const feedSubscription = await Models.RssChannelSubscription.query(qb => qb.where('feed_id', id).andWhere('channel', to)).fetch();

            if (!feedSubscription) {
                app.say(to, `There is no subscription with the ID ${id}, ${from}`);
                return;
            }

            const oldFeedSubscription = _.clone(feedSubscription.attributes);

            await feedSubscription.destroy();
            app.say(to, `I have removed the subscription from ${to}, to ${oldFeedSubscription.name} (${oldFeedSubscription.link}). All is well ${from}`);
        }
        catch (err) {
            logger.error('Something went wrong in the unsubscribe function inside the RssFeed', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong removing the subscription, ${from}`);
        }
    };
    app.Commands.set('rss-unsubscribe', {
        desc: '[id] Unsubscribe to a RSS feed via a ID provided in list-rss-feeds',
        access: app.Config.accessLevels.channelOpIdentified,
        call: unsubscribe
    });


    const subscribe = async (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(to, `I am sorry ${from}, I require a RSS feed ID to subscribe to a feed`);
            return;
        }

        const id = parseInt(text.split(' ')[0]);

        if (!_.isSafeInteger(id)) {
            app.say(to, `I am sorry ${from}, the ID you gave me is not a numeric value`);
            return;
        }

        try {
            const feed = await Models.RssFeed.query(qb => qb.where('id', id)).fetch();
            if (!feed) {
                app.say(to, `I am sorry ${from}, the feed you are trying to subscribe to does not exist`);
                return;
            }
            const feedSubscription = await Models.RssChannelSubscription.query(qb => qb.where('feed_id', id).andWhere('channel', to)).fetch();
            if (feedSubscription) {
                app.say(to, `I am sorry ${from}, that subscription already exists`);
                return;
            }

            await Models.RssChannelSubscription.create({
                'feed_id': id,
                'channel': to,
                'creator': from,
            });

            app.say(to, `A Subscription has been added for ${feed.attributes.name} to ${to}, ${from}`);
        }
        catch (err) {
            logger.error('Something went wrong in the subscribe function inside the RssFeed', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong adding the subscription, ${from}`);
        }
    };
    app.Commands.set('rss-subscribe', {
        desc: '[id] Subscribe to a RSS feed via a ID provided in list-rss-feeds',
        access: app.Config.accessLevels.channelOpIdentified,
        call: subscribe
    });

    const listSubscriptions = async (to, from, text, message) => {
        try {
            const subscriptions = await Models.RssChannelSubscription.query(qb => qb.where('channel', to)).fetchAll({
                withRelated: ['feed']
            });

            if (!subscriptions.length) {
                app.say(to, `${to} currently has no RSS subscriptions available, ${from}`);
                return;
            }

            if (to !== from) app.say(to, `I am messaging you the RSS subscriptions for ${to}, ${from}`);
            subscriptions.forEach(subscription => {
                app.say(from, `[${subscription.related('feed').attributes.id}] ${subscription.related('feed').attributes.name} <${subscription.attributes.creator}>`);
            });

        }
        catch (err) {
            logger.error('Something went with in listSubscriptions', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong listing the RSS subscriptions for ${to}, ${from}`);
        }
    };
    app.Commands.set('list-rss-subscriptions', {
        desc: 'List the RSS feeds the channel is currently subscribed to',
        access: app.Config.accessLevels.channelOpIdentified,
        call: listSubscriptions
    });

    // Add A feed to the Database
    const addFeed = async (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(to, `A URL and a Name is required to add a RSS feed, ${from}`);
            return;
        }

        const args = text.split(' ');
        const url = args.shift();
        const name = args.join(' ');

        if (!url) {
            app.say(to, `A URL is required to add a RSS feed, ${from}`);
            return;
        }

        if (!name) {
            app.say(to, `A Name is required to add a RSS feed, ${from}`);
            return;
        }

        // Validate URL
        try {
            // Attempt to parse the url to see if it throws an error
            const [finalUrl] = extractUrls(url);

            if (!finalUrl) {
                app.say(to, `The URL ${url} is not valid and cannot be used for a RSS feed`);
                return;
            }

            const record = await Models.RssFeed.create({
                creator: from,
                name: name,
                link: finalUrl
            });

            // Add To Feeder
            feeder.add({
                url: finalUrl,
                refresh: 2000,
            });

            app.say(to, `The RSS feed with the name [${name}] and the link ${url} has been created with the ID ${record.id}`);
        }
        catch (err) {
            // Duplicate Entry
            if (err.code === 'ER_DUP_ENTRY') {
                app.say(to, `I am sorry ${from}, a RSS feed with that link already exists`);
                return;
            }

            // Uncaught
            logger.error('Something went wrong creating a RSS feed', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong creating your RSS feed, ${from}`);
        }
    };
    app.Commands.set('add-rss-feed', {
        desc: '[url] [name] Add a RSS feed url',
        access: app.Config.accessLevels.admin,
        call: addFeed
    });

    // Remove a feed from the database
    const delFeed = async (to, from, text, message) => {
        if (_.isEmpty(text)) {
            app.say(to, `a ID is required to delete a RSS feed, ${from}`);
            return;
        }
        // Grab the ID
        const numericID = parseInt(text.split(' ')[0]);

        if (!_.isSafeInteger(numericID)) {
            app.say(to, `A RSS feed ID must be a numeric value, ${from}`);
            return;
        }

        try {
            // Grab The Feed
            const feed = await Models.RssFeed.query(qb => qb.where('id', numericID)).fetch({
                withRelated: ['subscriptions']
            });

            if (!feed) {
                app.say(to, `A RSS feed with the ID ${numericID} does not exist, ${from}`);
                return;
            }

            // Remove Subscriptions
            const subscriptions = feed.related('subscriptions');
            if (subscriptions.length) app.say(to, `I am removing ${subscriptions.length} subscriptions for the RSS feed ${feed.attributes.name}, ${from}`);
            subscriptions.forEach(subscription => subscription.destroy());

            // Remove from feeder
            feeder.remove(feed.attributes.link);

            // Destroy
            const previousAttributes = _.clone(feed.attributes);
            await feed.destroy();

            app.say(to, `The feed ${previousAttributes.name} with the ID ${numericID} has been deleted, ${from}`);
        }
        catch (err) {
            logger.error('Error deleting a RSS feed', {
                message: err.message || '',
                stack: err.stack || '',
            });

            app.say(to, `I am sorry, there was a problem deleting the RSS feed, ${from}`);
        }

    };
    app.Commands.set('del-rss-feed', {
        desc: '[url] Delete a RSS feed url',
        access: app.Config.accessLevels.admin,
        call: delFeed
    });

    // List feeds from the database
    const listFeeds = async (to, from, text, message) => {
        try {
            // Fetch Feeds
            const feeds = await Models.RssFeed.fetchAll();

            // No Feeds Available
            if (!feeds.length) {
                app.say(to, `I am sorry ${from}, there are no RSS feeds available`);
                return;
            }

            // Display Feeds
            if (to !== from) app.say(to, `The RSS feeds have been messaged to your, ${from}`);

            feeds.forEach(feed => app.say(from, `[${feed.attributes.id}] ${feed.attributes.name} - ${feed.attributes.link} ${feed.attributes.description || ''}`));
        }
        catch (err) {
            logger.error('Something went wrong in the RSS feed module', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, `Something went wrong listing the RSS feeds, ${from}`);
        }
    };
    app.Commands.set('list-rss-feeds', {
        desc: 'List RSS feeds',
        access: app.Config.accessLevels.channelOpIdentified,
        call: listFeeds
    });

    return scriptInfo;
};