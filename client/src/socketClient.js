export const socket = io();

socket.on('connect', () => { console.log('socket connected');  });
socket.on('disconnect', () => { console.log('socket disconnected') });