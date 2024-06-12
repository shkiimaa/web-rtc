import { useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const IoChat = () => {
  const ws = useRef<Socket>();
  const [nickname, setNickname] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [countUser, setCountUser] = useState<string>('');

  const [messageList, setMessageList] = useState<string[]>([]);
  const [roomList, setRoomList] = useState<string[]>([]);

  console.log(messageList);

  useEffect(() => {
    ws.current = io('http://localhost:8080');

    ws.current.on('connection', (msg) => {
      console.log(msg);
    });

    ws.current.on('join_room', (msg, countRoom) => {
      console.log(msg);
      setCountUser(countRoom);
    });

    ws.current.on('room_change', (roomList) => {
      setRoomList(roomList);
    });

    ws.current.on('new_message', (new_msg, nickname) => {
      setMessageList((prev) => [...prev, `${nickname} : ${new_msg}`]);
    });

    ws.current.on('exit', (msg) => {
      console.log(msg);
    });

    // 컴포넌트 언마운트 시 클린업
    return () => {
      ws.current?.disconnect();
    };
  }, []);

  const submitMessageFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(room);

    ws.current?.emit('message', message, room);
  };

  const submitNicknameFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ws.current?.emit('nickname', nickname);
  };

  const enterRoomFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ws.current?.emit('enter_room', room);
  };

  const onChangeMessageFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const onChangeNicknameFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const onChangeRoomFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoom(e.target.value);
  };

  return (
    <div>
      <ul>
        {roomList.map((room, idx) => (
          <li key={idx}>
            <button>{room}</button>
          </li>
        ))}
      </ul>
      <div>
        <button>Connect</button>
        <button>Disconnect</button>
        <button>Exit Room</button>
        <p>{countUser}</p>
      </div>

      <form onSubmit={enterRoomFn}>
        <input
          type="text"
          onChange={onChangeRoomFn}
          name="room"
          value={room}
          placeholder="room"
        />
        <button type="submit">Enter Room</button>
      </form>

      <form onSubmit={submitNicknameFn}>
        <input
          type="text"
          onChange={onChangeNicknameFn}
          name="nickname"
          value={nickname}
          placeholder="nickname"
        />
        <button type="submit">Send Nickname</button>
      </form>

      <form onSubmit={submitMessageFn}>
        <input
          type="text"
          onChange={onChangeMessageFn}
          name="message"
          value={message}
          placeholder="message"
        />
        <button type="submit">Send Message</button>
      </form>

      <ul>
        {messageList.map((message, idx) => (
          <li key={idx}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default IoChat;
