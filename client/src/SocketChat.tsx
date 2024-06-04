// import { useEffect } from 'react';

import { useEffect, useRef, useState } from 'react';

interface IMessage {
  type: 'nickname' | 'message' | '';
  payload: string;
}

const SocketChat = () => {
  const [nickname, setNickname] = useState<IMessage>({
    type: 'nickname',
    payload: '',
  });
  const [message, setMessage] = useState<IMessage>({
    type: 'message',
    payload: '',
  });
  const [messageList, setMessageList] = useState<string[]>([]);

  const ws = useRef<WebSocket>();

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('open');
    };

    ws.current.onclose = () => {
      console.log('close');
    };

    ws.current.onmessage = (message) => {
      setMessageList((prev) => [...prev, message.data]);
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

  const onChangeMessageFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage({ ...message, payload: e.target.value });
  };

  const onChangeNicknameFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname({ ...nickname, payload: e.target.value });
  };

  return (
    <div>
      <div>
        <button>Connect</button>
        <button>Disconnect</button>
      </div>

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

export default SocketChat;
