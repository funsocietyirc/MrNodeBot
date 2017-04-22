'use static';
const scriptInfo = {
  name: 'queue',
  desc: 'Manipluate the watch-youtube queue',
  createdBy: 'IronY'
};

module.exports = app => {
  const clearQueue = (to, from, text, message) => {
    if(!app.WebServer.socketIO) return;
    app.WebServer.socketIO.emit('youtube-control', {
      command: 'clear'
    });
  };

  const clearQueueItem = (to, from, text, message) => {
    if(!app.WebServer.socketIO) return;
    app.WebServer.socketIO.emit('youtube-control', {
      command: 'remove',
      index: intval(text)
    });
  };

  // Terminate the bot and the proc watcher that keeps it up
  app.Commands.set('clear-youtube-queue', {
    desc: 'Force clear the youtube clients queue',
    access: app.Config.accessLevels.admin,
    call: clearQueue
  });

  // Terminate the bot and the proc watcher that keeps it up
  app.Commands.set('clear-youtube-queue-item', {
    desc: 'Force clear the youtube clients queue',
    access: app.Config.accessLevels.admin,
    call: clearQueueItem
  });

  // Return the script info
  return scriptInfo;
};
