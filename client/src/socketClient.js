export const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location);

socket.on('connect', () => { console.log('socket connected');  });
socket.on('disconnect', () => { console.log('socket disconnected') });