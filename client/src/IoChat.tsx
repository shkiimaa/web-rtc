import { useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

interface IMessage {
  type: 'nickname' | 'message' | 'room' | '';
  payload: string;
}

const IoChat = () => {
  const ws = useRef<Socket>();
  const [nickname, setNickname] = useState<IMessage>({
    type: 'nickname',
    payload: '',
  });
  const [message, setMessage] = useState<IMessage>({
    type: 'message',
    payload: '',
  });
  const [room, setRoom] = useState<IMessage>({ type: 'room', payload: '' });
  const [messageList, setMessageList] = useState<string[]>([]);

  useEffect(() => {
    ws.current = io('ws://localhost:8080');
    ws.current.on('welcome', (msg) => {
      console.log('하이하이하이');
    });

    // 컴포넌트 언마운트 시 클린업
    return () => {
      ws.current?.disconnect();
    };
  }, []);

  const sendMessageFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ws.current?.send(JSON.stringify(message));
  };

  const sendNicknameFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ws.current?.send(JSON.stringify(nickname));
  };

  const enterRoomFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ws.current?.emit('enter_room', room, (msg: string) => {
      console.log(msg);
    });
  };

  const onChangeMessageFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage({ ...message, payload: e.target.value });
  };

  const onChangeNicknameFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname({ ...nickname, payload: e.target.value });
  };

  const onChangeRoomFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoom({ ...room, payload: e.target.value });
  };

  return (
    <div>
      <div>
        <button>Connect</button>
        <button>Disconnect</button>
      </div>

      <form onSubmit={enterRoomFn}>
        <input
          type="text"
          onChange={onChangeRoomFn}
          name="room"
          value={room.payload}
          placeholder="room"
        />
        <button type="submit">Send</button>
      </form>

      <form onSubmit={sendNicknameFn}>
        <input
          type="text"
          onChange={onChangeNicknameFn}
          name="nickname"
          value={nickname.payload}
        />
        <button type="submit">Send</button>
      </form>

      <form onSubmit={sendMessageFn}>
        <input
          type="text"
          onChange={onChangeMessageFn}
          name="message"
          value={message.payload}
        />
        <button type="submit">Send</button>
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
