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

const countRoom = (roomName) => {
  const room = io.sockets.adapter.rooms.get(roomName);
  return room ? room.size : 0;
};

const ioEnterRoom = (socket) => {
  socket.on('join_room', (room) => {
    const roomExists = io.sockets.adapter.rooms.has(room);
    console.log(`방 존재 여부: ${roomExists}`);

    socket.join(room);

    io.sockets.emit('room_change', publicRooms());

    io.to(room).emit('welcome', '방 입장', countRoom(room), () => {
      console.log('환영 메시지 전송 성공');
    });

    socket.to(room).emit('connectPeer');

    console.log(`방 참여 인원 수: ${countRoom(room)}`);
  });
};

io.on('connect', (socket) => {
  socket.emit('connection', '서버 연결');
  console.log('새로운 클라이언트 연결');

  socket.on('join_room', (room) => {
    const roomExists = io.sockets.adapter.rooms.has(room);
    console.log(`방 존재 여부: ${roomExists}`);

    socket.join(room);

    io.sockets.emit('room_change', publicRooms());

    io.to(room).emit('welcome', '방 입장', countRoom(room), () => {
      console.log('환영 메시지 전송 성공');
    });

    socket.to(room).emit('connectPeer');

    console.log(`방 참여 인원 수: ${countRoom(room)}`);
  });

  socket.on('message', (msg, room) => {
    socket.to(room).emit('new_message', msg, socket.nickname);
    console.log(
      `메시지 전송: ${msg} (방: ${room}, 보낸이: ${socket.nickname})`
    );
  });

  socket.on('offer', (offer, roomName) => {
    // console.log(offer);
    console.log(roomName);

    socket.to(roomName).emit('offer', offer);
  });

  socket.on('answer', (answer, roomName) => {
    // console.log(offer);
    console.log(roomName);

    socket.to(roomName).emit('answer', answer);
  });

  socket.on('ice', (ice, roomName) => {
    socket.to(roomName).emit('ice', ice);
  });

  socket.on('nickname', (nickname) => {
    socket.nickname = nickname;
    console.log(`닉네임 설정: ${nickname}`);
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit('exit', '퇴장');
      console.log(`방 퇴장: ${socket.nickname}`);
    });
  });

  socket.on('disconnect', () => {
    io.sockets.emit('room_change', publicRooms());
    console.log('클라이언트 연결 해제');
  });
});

server.listen(port, () => {
  console.log(`HTTP PORT : ${port}`);
});
