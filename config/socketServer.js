const jwt = require('jsonwebtoken');
const Server = require('socket.io').Server;

module.exports = function (server) {
  const io = new Server(server);

  io.use((socket, next) => {
    try {
      socket.data.username = jwt.verify(
        socket.handshake.auth.token,
        process.env.ACCESS_TOKEN_SECRET
      ).username;
    } catch (err) {
      return next(new Error('Failed to authenticate'));
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected - ${socket.id}, ${socket.data.username}`);

    let timer = null;

    socket.on('userTyping', (roomId) => {
      // check if user is logged into the room
      if (socket.rooms.has(roomId)) {
        socket.broadcast.to(roomId).emit('userTyping', socket.data.username);

        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          timer = null;
          socket.broadcast
            .to(roomId)
            .emit('userStoppedTyping', socket.data.username);
        }, 3000);
      }
    });

    socket.on('leaveChatRoom', (roomId) => {
      if (timer) {
        clearTimeout(timer);
      }

      socket.leave(roomId);
    });
  });

  return io;
};
