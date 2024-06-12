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

const publicRooms = () => {
  const { sids, rooms } = io.sockets.adapter;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (!sids.get(key)) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

io.on('connect', (socket) => {
  socket.emit('connection', '서버 연결');
  console.log('새로운 클라이언트 연결');

  socket.on('join_room', (room) => {
    socket.join(room);

    socket.to(room).emit('connectPeer');
  });

  socket.on('offer', (offer, roomName) => {
    socket.to(roomName).emit('offer', offer);
  });

  socket.on('answer', (answer, roomName) => {
    socket.to(roomName).emit('answer', answer);
  });

  socket.on('ice', (ice, roomName) => {
    socket.to(roomName).emit('ice', ice);
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit('exit', '퇴장');
    });
  });

  socket.on('disconnect', () => {
    io.sockets.emit('room_change');
    console.log('클라이언트 연결 해제');
  });
});

server.listen(port, () => {
  console.log(`HTTP PORT : ${port}`);
});
