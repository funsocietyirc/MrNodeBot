'use strict';

const scriptInfo = {
    name: 'watchYoutube',
    desc: 'watchYoutube module',
    createdBy: 'IronY'
};

const _ = require('lodash');
const gen = require('../generators/_youTubeVideoData');
const logger = require('../../lib/logger');
const shortService = require('../lib/_getShortService')();
const searchYoutube = require('../generators/_searchYoutubeVideos');
const youTubeRoute = 'https://www.youtube.com/watch?v=';

// Typography
const {
    logos,
    icons,
    StringBuilder
} = require('../lib/_ircTypography');

module.exports = app => {
    // No SocketIO detected, or feature is disabled
    if (!app.WebServer.socketIO || _.isEmpty(app.Config.features.watchYoutube) || !app.Config.features.watchYoutube)
        return scriptInfo;

    // Name of SocketIO namespace
    const namespace = '/youtube';

    // Name of SocketIO Room
    const room = 'watching';

    // Decorate a channel name to avoid collisions
    // Invalid args return the root channel '/'
    const activeChannelFormat = chanName => chanName !== null ?
        `/${chanName.toLowerCase()}` :
        '/';

    // Join the namespace
    const socket = app.WebServer.socketIO.of(namespace);

    // Attach a listener to on connection
    socket.removeAllListeners('connection');

    socket.on('connection', connection => {
        // Decorate the active channel name to avoid collisions
        const activeChannel = activeChannelFormat(connection.handshake.query.activeChannel);

        // Get Channel Stats
        const channelStats = () => Object.assign({}, {
            // Total Server listeners
            totalListeners: socket.adapter.rooms[room] ? socket.adapter.rooms[room].length : 0,
            // Total Listeners of active channel
            channelListeners: socket.adapter.rooms[activeChannel] ? socket.adapter.rooms[activeChannel].length : 0,
            // Channel List
            channels: _(socket.adapter.rooms).pickBy(
                    (v, k) => !_.startsWith(k, namespace) && !_.startsWith(k, room)
                )
                .map((v, k) => Object.assign({}, {
                    channel: k === '/' ? 'Lobby' : k.substring(1).toUpperCase(),
                    count: v.length || 0,
                }))
                .orderBy(['length','desc'])
                .value(),
        });


        // Send Initial HR Time
        socket.to(connection.id).emit('timesync', Date.now());

        // Join the room
        connection.join(room);

        // Join the active channel
        connection.join(activeChannel);

        // // Listen for any responses
        connection.removeAllListeners('new-reply');
        connection.on('new-reply', data => socket.to(activeChannel).emit('queue', data));

        // Like
        connection.removeAllListeners('like');
        connection.on('like', () => socket.to(activeChannel).emit('like'));

        // Listen for Disconnects
        connection.removeAllListeners('disconnect');
        connection.on('disconnect', disconnect => socket.to(activeChannel).emit('left', channelStats()));

        // emit new connection event to the rest of the room
        socket.to(activeChannel).emit('new', channelStats());
    });

    // TV Play Command
    if (app.Config.apiKeys.google && !_.isEmpty(app.Config.apiKeys.google))
        app.Commands.set('tv-play', {
            desc: '<video name>',
            access: app.Config.accessLevels.identified,
            call: async (to, from, text, message) => {
                // Nothing was given
                if (_.isEmpty(text)) {
                    app.say(to, `I need something to search ${from}`);
                    return;
                }
                try {
                    // Fetch Results
                    const result = await searchYoutube(app.Config.apiKeys.google, text);

                    // No Results
                    if (!result || !result.items) {
                        app.say(to, `I was unable to find anything ${from}`);
                        return;
                    }

                    // Todo filter
                    const video = result.items[0];

                    // Send to socket
                    socket.to(activeChannelFormat(to)).emit('message', Object.assign({}, {
                        to: to,
                        from: from,
                        timestamp: Date.now(),
                        seekTime: 0,
                        video: {
                            videoTitle: video.title,
                            key: video.videoId
                        }
                    }));

                    // Construct String Builder
                    const sb = new StringBuilder({
                        logo: 'youTubeTv'
                    });

                    // Grab the short URL
                    const link = await shortService(youTubeRoute + video.videoId);

                    // Build String
                    sb
                        .append(`I am now playing ${video.title} on the ${to} station for you ${from}`)
                        .insertLogo('youTube')
                        .insertIcon('anchor')
                        .insert(link || youTubeRoute + video.videoId);

                    // Report Back
                    app.say(
                        to,
                        sb.toString()
                    );
                }
                    // Catch Error
                catch (err) {
                    // Log
                    logger.error('Something went wrong getting results for the tv-play command', {
                        message: err.message || '',
                        stack: err.stack || ''
                    });
                    // Report
                    app.say(to, `Something went wrong getting your results ${from}`);
                }

            }
        });

    // Get total Listeners (Identified)
    app.Commands.set('tv-watchers', {
        desc: '[channel?] Get the number of all watchers of the youtube stream',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
            // Get specified channel
            const channel = text.split(' ')[0];
            const procChannel = channel ?
                activeChannelFormat(channel) :
                activeChannelFormat(to);

            const count = socket.adapter.rooms[procChannel] ?
                socket.adapter.rooms[procChannel].length :
                0;

            const roomCount = socket.adapter.rooms[room] ?
                socket.adapter.rooms[room].length :
                0;

            const diff = roomCount - count;

            app.say(to, `${count} connections are viewing the${procChannel
                ? ' ' + procChannel
                : ''} stream, ${diff} are watching other Channels`);
        }
    });

    // TV Administration Command
    app.Commands.set('tv-admin', {
        desc: 'TV Administration',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
            // Parse the args
            const args = text.split(' ');

            // No Args Provided
            if (_.isEmpty(args)) {
                app.say(to, 'Subcommand required, use help for more information');
                return;
            }

            // A list of available commands
            const cmds = {
                help: "Get Subcommand usage",
                clear: "<channel?> -- Force of a clear of all connected clients queues",
                reload: "<channel?> -- Force all clients to reload",
                remove: "<channel> <index> -- Remove a index from all connected clients queues",
                speak: "<channel> <message> -- Speak (or display if speak is not available) a message",
                skip: "<channel?> -- Skip the current Video (Only if the queue contains additional videos)"
            };

            // Switch on the command
            switch (args[0]) {
                // Usage Information
                case 'help':
                    _(cmds).each((v, k) => app.say(to, `${k}: ${v}`));
                    break;
                // Clear a queue
                case 'clear':
                    socket.to(activeChannelFormat(args[1] || to)).emit('control', {
                        command: 'clear'
                    });
                    app.say(to, `The queue for ${args[1] || to} has been cleared`);
                    break;
                // Remove an item from the queue index
                case 'speak':
                    if (!args[1] || !args[2]) {
                        app.say(to, `A Channel and Message is required when speaking`);
                        return;
                    }
                    let tmpArray = args.slice();
                    tmpArray.splice(0, 2);
                    socket.to(activeChannelFormat(args[1])).emit('control', {
                        command: 'speak',
                        message: tmpArray.join(' ')
                    });
                    break;
                case 'remove':
                    // No channel / Index given
                    if (!args[1] || !args[2]) {
                        app.say(to, `A Channel and Index is required when removing a queue item`);
                        return;
                    }
                    // Send event
                    socket.to(activeChannelFormat(args[1])).emit('control', {
                        command: 'remove',
                        index: args[2]
                    });
                    // Report Back
                    app.say(to, `The TV Queue item ${args[2]} has been broadcast for deletion on ${args[1]}`);
                    break;
                // Force The Client to reload
                case 'reload':
                    socket.to(activeChannelFormat(args[1] || to)).emit('control', {
                        command: 'reload'
                    });
                    app.say(to, `Clients on ${args[1] || to} have been Refreshed`);
                    break;
                // Force The Client to reload
                case 'skip':
                    socket.to(activeChannelFormat(args[1] || to)).emit('control', {
                        command: 'skip'
                    });
                    app.say(to, `Current Video on ${args[1] || to} has been skipped`);
                    break;
                default:
                    app.say(to, `Subcommand not found, available commands are ${Object.keys(cmds).join(', ')}`);
                    break;
            }

        }
    });

    // Return the script info
    return scriptInfo;
};
