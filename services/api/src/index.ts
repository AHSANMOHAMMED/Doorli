import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { setSocketServer } from './lib/socket.js';

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  socket.on('join', (rooms: string | string[]) => {
    const list = Array.isArray(rooms) ? rooms : [rooms];
    for (const room of list) {
      if (typeof room === 'string' && room.length > 0) {
        socket.join(room);
      }
    }
  });
});

setSocketServer(io);

server.listen(env.API_PORT, () => {
  console.log(`Doorli API running on http://localhost:${env.API_PORT}`);
  console.log(`Swagger docs at http://localhost:${env.API_PORT}/api/docs`);
  console.log(`Socket.io ready on ws://localhost:${env.API_PORT}`);
});
