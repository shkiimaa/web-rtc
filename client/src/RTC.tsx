import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const RTC = () => {
  const dataChannel = useRef<RTCDataChannel>();
  const socketIo = useRef<Socket>();
  const rtc = useRef<RTCPeerConnection>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const room = useRef('');

  // MediaDevices State
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>();
  const [audios, setAudios] = useState<MediaDeviceInfo[]>();
  const [devices, setDevices] = useState({ audioId: '', videoId: '' });

  // Socket.io State
  const [roomName, setRoomName] = useState('');

  // MediaDevices Function
  const getMedia = async () => {
    try {
      const myStream = await navigator.mediaDevices.getUserMedia({
        audio: devices.audioId !== '' ? { deviceId: devices.audioId } : true,
        video: devices.videoId !== '' ? { deviceId: devices.videoId } : true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = myStream;
        setLocalStream(myStream);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const audios = devices.filter((device) => device.kind === 'audioinput');
    setCameras(cameras);
    setAudios(audios);
  };

  useEffect(() => {
    getDevices();
    getMedia();
  }, [devices]);

  // RTC Function
  const RTCConnection = async () => {
    rtc.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
          ],
        },
      ],
    });

    rtc.current.ontrack = (e) => {
      console.log(e, '트랙변경 이벤트 리스터');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    rtc.current.onicecandidate = (e) => {
      socketIo.current?.emit('ice', e.candidate, room.current);
    };

    localStream
      ?.getTracks()
      .forEach((track) => rtc?.current?.addTrack(track, localStream));
  };

  useEffect(() => {
    (async () => {
      await RTCConnection();

      if (rtc.current) {
        const videoTrack = localStream?.getVideoTracks()[0];
        const videoSender = rtc.current
          .getSenders()
          .find((sender) => sender.track?.kind === 'video');

        console.log(videoSender);
        console.log(localStream?.getVideoTracks()[0]);

        // bug
        if (videoTrack) {
          console.log('비디오 트랙 변경');

          videoSender?.replaceTrack(videoTrack);
        }
      }
    })();
  }, [localStream]);

  // Socket.io Function
  useEffect(() => {
    socketIo.current = io('http://localhost:8080');

    // socket 연결
    socketIo.current.on('connection', (msg) => {
      console.log(msg);
    });

    // 방 입장
    socketIo.current.on('join_room', (msg, countRoom) => {
      console.log(msg);
      console.log(countRoom);
    });

    // peer 연결 및 offer 전송
    socketIo.current.on('connectPeer', async () => {
      // dataChannel.current = rtc.current?.createDataChannel('chat');

      // if (dataChannel.current)
      //   dataChannel.current.onmessage = (e) => {
      //     console.log(dataChannel.current);
      //   };

      const offer = await rtc.current?.createOffer();
      rtc.current?.setLocalDescription(offer);
      console.log('peer connect');

      socketIo.current?.emit('offer', offer, room.current);
      console.log('send offer');
    });

    // offer 수신 및 answer 전송
    socketIo.current.on('offer', async (offer) => {
      if (rtc.current)
        rtc.current.ondatachannel = (e) => {
          dataChannel.current = e.channel;
          dataChannel.current.onmessage = (e) => {
            console.log(e);
          };
        };

      rtc.current?.setRemoteDescription(offer);
      const answer = await rtc.current?.createAnswer();
      console.log('get offer');

      rtc.current?.setLocalDescription(answer);
      socketIo.current?.emit('answer', answer, room.current);
      console.log('send answer');
    });

    // answer 수신
    socketIo.current.on('answer', async (answer) => {
      rtc.current?.setRemoteDescription(answer);
      console.log('get answer');
    });

    // ice 수신
    socketIo.current.on('ice', (ice) => {
      rtc.current?.addIceCandidate(ice);
      console.log('get ice');
    });

    socketIo.current.on('exit', (msg) => {
      console.log(msg);
    });

    return () => {
      socketIo.current?.disconnect();
    };
  }, []);

  // Event Function
  const onChangeDeviceFn = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDevices({ ...devices, [name]: value });
  };

  const onClickAudioToggleFn = () => {
    localStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
  };

  const onClickToggleCameraFn = () => {
    localStream
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
  };

  const onChangeRoomFn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(String(e.target.value));
    room.current = e.target.value;
  };

  const onSubmitEnterRoomFn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socketIo.current?.emit('join_room', room.current);
  };

  return (
    <>
      <h1>{roomName}</h1>
      <div>
        <form onSubmit={onSubmitEnterRoomFn}>
          <input
            type="text"
            name="room"
            required
            placeholder="room"
            onChange={onChangeRoomFn}
          />
          <button type="submit">Enter</button>
        </form>
      </div>
      <div>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          width={400}
          height={400}
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          width={400}
          height={400}
        ></video>
        <div>
          <button onClick={onClickAudioToggleFn}>mute</button>
          <button onClick={onClickToggleCameraFn}>camera</button>

          <select name="videoId" onChange={onChangeDeviceFn}>
            {cameras?.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label}
              </option>
            ))}
          </select>

          <select name="audioId" onChange={onChangeDeviceFn}>
            {audios?.map((audio) => (
              <option key={audio.deviceId} value={audio.deviceId}>
                {audio.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default RTC;
