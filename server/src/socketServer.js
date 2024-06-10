import http from 'http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const port = 8080;

const server = http.createServer(app);
const io = new Server(server, { cors: ['http//:localhost:5173'] });

io.on('connection', (socket) => {
  socket.on('enter_room', (room, cb) => {
    socket.join(room);
    // cb(`${room} 접속 성공`);

    socket.to(room).emit('welcome');
  });
});

/* const wss = new WebSocketServer({ server });

const sockets = [];

wss.on('connection', (socket) => {
  console.log('Connected to client ✅');
  sockets.push(socket);

  socket.send('연결 되었습니다.');

  socket.on('close', () => {
    console.log('Disconnected from the client ❌');
  });

  socket.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    socket.nickname = 'unknown';

    if (parsedMessage.type === 'nickname')
      socket.nickname = parsedMessage.payload;

    if (parsedMessage.type === 'message')
      sockets.forEach((socket) =>
        socket.send(`${socket.nickname} : ${parsedMessage.payload}`)
      );
  });
}); */

server.listen(port, () => {
  console.log(`HTTP PORT : ${port}`);
});
