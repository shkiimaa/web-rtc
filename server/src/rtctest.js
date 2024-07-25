import http from 'http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const port = 8080;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://192.168.0.93:5173'] },
  pingTimeout: 60000, // 타임아웃 시간 조정 (단위: 밀리초)
  pingInterval: 25000, // 핑 전송 간격 조정 (단위: 밀리초)
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });

    socket.on('send-offer', (userId, description) => {
      socket.to(roomId).broadcast.emit('receive-offer', description, userId);
    });

    socket.on('send-answer', (userId, description) => {
      socket.to(roomId).broadcast.emit('receive-answer', description, userId);
    });

    socket.on('send-ice-candidate', (userId, candidate) => {
      socket
        .to(roomId)
        .broadcast.emit('receive-ice-candidate', candidate, userId);
    });
  });
});

server.listen(port, () => {
  console.log(`HTTP PORT : ${port}`);
});
