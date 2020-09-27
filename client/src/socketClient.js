// if running locally, connect to the local api server, otherwise use current site's origin
const loc = window.location;
const url = (loc.hostname === 'localhost') ? ('http://localhost:8000') : (loc.protocol + '//' + loc.host);

export const socket = io(url);

socket.on('connect', () => { console.log('socket connected');  });
socket.on('disconnect', () => { console.log('socket disconnected') });