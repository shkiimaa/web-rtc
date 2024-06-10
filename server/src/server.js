import http from 'http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const port = 8080;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' },
  timeout: 10000, // 필요한 경우 이 값을 조정하세요
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

io.on('connection', (socket) => {
  socket.emit('connection', '서버 연결');

  socket.on('enter_room', (room) => {
    const roomExists = io.sockets.adapter.rooms.has(room);

    console.log(`방 존재 여부: ${roomExists}`);
    console.log(`방 이름: ${room}`);

    socket.join(room);

    console.log(`소켓이 참여한 방: ${Array.from(socket.rooms).join(', ')}`);

    io.sockets.to(room).emit('welcome', '방 입장', (err) => {
      if (err) {
        console.log(`에러: ${err}`);
      } else {
        console.log('환영 메시지 전송 성공');
      }
    });

    // sids는 개인방만, rooms는 개인방, 공개방 다있음
    const { sids, rooms } = io.sockets.adapter;
    console.log('-----------');
    sids.forEach((v, k) => console.log(`value : ${v} key : ${k}`));
    console.log('-----------');
    rooms.forEach((v, k) => console.log(`value : ${v} key : ${k}`));
    console.log('-----------');
  });

  socket.on('message', (msg, room) => {
    socket.to(room).emit('new_message', msg, socket.nickname);
  });

  socket.on('nickname', (nickname) => {
    socket.nickname = nickname;
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => socket.to(room).emit('exit', '퇴장'));
  });
});

server.listen(port, () => {
  console.log(`HTTP PORT : ${port}`);
});
