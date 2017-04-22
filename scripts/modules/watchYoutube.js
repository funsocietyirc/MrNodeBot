'use static';
const scriptInfo = {
  name: 'watchYoutube',
  desc: 'watchYoutube module',
  createdBy: 'IronY'
};

module.exports = app => {
  // No SocketIO detected
  if (!app.WebServer.socketIO) return scriptInfo;

  // Name of SocketIO namespace
  const namespace = '/youtube';

  // Name of SocketIO Room
  const room = 'watching';

  // Join the namespace
  const socket = app.WebServer.socketIO.of(namespace);

  // Get the total listener count
  const getTotalListeners = () => socket.adapter.rooms[room] ? socket.adapter.rooms[room].length : 0;

  // Add The Listeners, be sure to remove so it does not duplicate on script reload
  socket.removeAllListeners('connection');

  // Attach a listener to on connection
  socket.on('connection', connection => {
    connection.join(room);
  });

  // Force clear the queue (Admin)
  app.Commands.set('clear-youtube-queue', {
    desc: 'Force clear the youtube clients queue',
    access: app.Config.accessLevels.admin,
    call: (to, from, text, message) => {
      socket.to(room).emit('control', {
        command: 'clear'
      });
      app.say(from, `Playlist cleared`);
    }
  });

  // Get total Listeners (Identified)
  app.Commands.set('get-total-watchers', {
    desc: 'Get the number of all watchers of the youtube stream',
    access: app.Config.accessLevels.identified,
    call: (to, from, text, message) => app.say(to, `${getTotalListeners()} connections are viewing the stream`)
  });

  // Remove an Item from the queue (Admin)
  app.Commands.set('clear-youtube-queue-item', {
    desc: 'Force clear the youtube clients queue',
    access: app.Config.accessLevels.admin,
    call: (to, from, text, message) => {
      if (!app.WebServer.socketIO || !text || text === '') return;
      socket.to(room).emit('control', {
        command: 'remove',
        index: text
      });
      app.say(from, `Item Removed`);
    }
  });

  // Return the script info
  return scriptInfo;
};
