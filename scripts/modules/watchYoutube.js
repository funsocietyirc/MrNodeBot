'use static';
const scriptInfo = {
  name: 'watchYoutube',
  desc: 'watchYoutube module',
  createdBy: 'IronY'
};

const _ = require('lodash');

module.exports = app => {
    // No SocketIO detected
    if (!app.WebServer.socketIO) return scriptInfo;

    // Name of SocketIO namespace
    const namespace = '/youtube';

    // Name of SocketIO Room
    const room = 'watching';

    // Join the namespace
    const socket = app.WebServer.socketIO.of(namespace);

    // Attach a listener to on connection
    socket.removeAllListeners('connection');

    socket.on('connection', connection => {
        // Join the room
        connection.join(room);

        // Join a room with the channelName
        const activeChannel = `/${connection.handshake.query.activeChannel}` || '/';
        connection.join(activeChannel);

        // Listen for any reponses
        connection.removeAllListeners('new-reply');
        connection.on('new-reply', data => {
            socket.to(activeChannel).emit('queue', Object.assign(data, function() {
                return {
                  totalListeners: socket.adapter.rooms[room].length,
                  channelListeners: socket.adapter.rooms[activeChannel].length
                };
              }());
            });

          // Like
          connection.removeAllListeners('like'); connection.on('like', () => {
            socket.to(activeChannel).emit('like');
          });

          // Listen for Disconnects
          connection.removeAllListeners('disconnect') connection.on('disconnect',
            disconnect => socket.to(activeChannel).emit('left',
              function() {
                return {
                  totalListeners: socket.adapter.rooms[room].length,
                  channelListeners: socket.adapter.rooms[activeChannel].length
                };
              }()
            ));

          // emit new connection event to the rest of the room
          socket.to(activeChannel).emit('new',
            function() {
              return {
                totalListeners: socket.adapter.rooms[room].length,
                channelListeners: socket.adapter.rooms[activeChannel].length
              };
            }()
          );


        });


      // Get total Listeners (Identified)
      app.Commands.set('tv-watchers', {
        desc: '[channel?] Get the number of all watchers of the youtube stream',
        access: app.Config.accessLevels.identified,
        call: (to, from, text, message) => {
          let channel = text.split(' ')[0];
          let count = channel ? getChannelListenersOnActive(channel) : getTotalListeners();
          app.say(to, `${count} connections are viewing the${channel ? ' ' + channel : ''} stream`);
        }
      });

      // TV Administration Command
      app.Commands.set('tv-admin', {
        desc: 'TV Administration',
        access: app.Config.accessLevels.admin,
        call: (to, from, text, message) => {
          // Parse the args
          let args = text.split(' ');

          // No Args Provided
          if (!args.length) {
            app.say(to, 'Subcommand required, use help for more information');
            return;
          }

          // A list of available commands
          const cmds = {
            help: "Get Subcommand usage",
            clear: "<channel?> -- Force of a clear of all connected clients queues",
            remove: "<index> <channel?> -- Remove a index from all connected clients queues"
          };

          // Switch on the command
          switch (args[0]) {
            case 'help':
              _(cmds).each((v, k) => app.say(to, `${k}: ${v}`));
              break;
            case 'clear':
              socket.to(room).emit('control', {
                command: 'clear',
                channel: args[1] || to
              });
              app.say(to, `TV Queue cleared`);
              break;
            case 'remove':
              // No index given
              if (!args[1] || args[1] === '') {
                app.say(to, `A second argument containing the index of the item you would like removed is required`);
                return;
              }
              // Send event
              socket.to(room).emit('control', {
                command: 'remove',
                index: args[1],
                channel: args[2] || to
              });
              // Report Back
              app.say(to, `The TV Queue item ${args[1]} has been broadcast for deletion`);
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
