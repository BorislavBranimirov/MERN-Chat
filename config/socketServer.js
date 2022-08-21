const jwt = require('jsonwebtoken');
const Server = require('socket.io').Server;

module.exports = function (server) {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log(`Socket connected - ${socket.id}`);
    let timer = null;
    let username = null;

    // username used for typing is derived, verified and stored here,
    // instead of being sent as an argument along with the roomId in the
    // 'userTyping' event, so that the user can't change the token or react
    // state on the client-side and appear as a different person in the message
    socket.on('setUserTypingUsername', (token) => {
      try {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        username = payload.username;
      } catch (err) {
        console.log(`${socket.id} failed to authenticate`);
      }
    });

    socket.on('userTyping', (roomId) => {
      // check if user is logged into the room
      if (socket.rooms.has(roomId)) {
        socket.broadcast.to(roomId).emit('userTyping', username);

        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          timer = null;
          socket.broadcast.to(roomId).emit('userStoppedTyping', username);
        }, 3000);
      }
    });

    socket.on('leaveChatRoom', (roomId) => {
      if (timer) {
        clearTimeout(timer);
      }
      username = null;

      socket.leave(roomId);
    });
  });

  return io;
};
