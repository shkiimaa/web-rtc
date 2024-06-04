import http from 'http';
import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';

const app = express();
const port = 8080;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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
});

server.listen(port, () => {
  console.log(`HTTP PORT : ${port}`);
});
