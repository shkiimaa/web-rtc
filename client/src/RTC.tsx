import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const RTC = () => {
  const socketIo = useRef<Socket>();
  const rtc = useRef<RTCPeerConnection>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const opponentVideoRef = useRef<HTMLVideoElement>(null);

  const room = useRef('');

  // MediaDevices State
  const [userMedia, setUserMedia] = useState<MediaStream>();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>();
  const [audios, setAudios] = useState<MediaDeviceInfo[]>();
  const [devices, setDevices] = useState({ audioId: '', videoId: '' });

  // Socket.io State
  const [roomName, setRoomName] = useState('');

  // MediaDevices Function
  const getMedia = async (deviceId?: {
    videoId?: string;
    audioId?: string;
  }) => {
    try {
      const myStream = await navigator.mediaDevices.getUserMedia({
        audio:
          deviceId?.audioId !== '' ? { deviceId: deviceId?.audioId } : true,
        video:
          deviceId?.videoId !== '' ? { deviceId: deviceId?.videoId } : true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = myStream;
        setUserMedia(myStream);
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
    getMedia(devices);
    getDevices();
  }, [devices]);

  // RTC Function
  const RTCConnection = async () => {
    rtc.current = new RTCPeerConnection();

    userMedia
      ?.getTracks()
      .forEach((track) => rtc?.current?.addTrack(track, userMedia));
  };

  rtc.current?.addEventListener('icecandidate', (data) => {
    socketIo.current?.emit('ice', data.candidate, room.current);
  });

  rtc.current?.addEventListener('track', (data) => {
    console.log(data);

    if (opponentVideoRef.current)
      opponentVideoRef.current.srcObject = data.streams[0];
  });

  useEffect(() => {
    RTCConnection().then(() => {
      if (rtc.current) {
        const videoSender = rtc.current
          .getSenders()
          .find((sender) => sender.track?.kind === 'video');

        const videoTrack = userMedia?.getVideoTracks()[0];
        console.log(videoTrack);

        videoTrack && videoSender?.replaceTrack(videoTrack);
        console.log(videoTrack);
      }
    });
  }, [userMedia]);

  // Socket.io Function
  useEffect(() => {
    socketIo.current = io('http://localhost:8080');

    socketIo.current.on('connection', (msg) => {
      console.log(msg);
    });

    socketIo.current.on('join_room', (msg, countRoom) => {
      console.log(msg);
      console.log(countRoom);
    });

    // peer 연결 및 offer 전송
    socketIo.current.on('connectPeer', async () => {
      const offer = await rtc.current?.createOffer();
      rtc.current?.setLocalDescription(offer);

      console.log('send offer');

      socketIo.current?.emit('offer', offer, room.current);
    });

    // offer 수신 및 answer 전송
    socketIo.current.on('offer', async (offer) => {
      rtc.current?.setRemoteDescription(offer);
      const answer = await rtc.current?.createAnswer();

      rtc.current?.setLocalDescription(answer);
      socketIo.current?.emit('answer', answer, room.current);
    });

    // answer 수신
    socketIo.current.on('answer', async (answer) => {
      rtc.current?.setRemoteDescription(answer);
    });

    socketIo.current.on('ice', (ice) => {
      rtc.current?.addIceCandidate(ice);
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

    if (rtc.current && name === 'videoId') {
      const videoSender = rtc.current
        .getSenders()
        .find((sender) => sender.track?.kind === 'video');

      const videoTrack = userMedia?.getVideoTracks()[0];
      console.log(videoTrack);

      videoTrack && videoSender?.replaceTrack(videoTrack);
    }
  };

  const onClickMuteFn = () => {
    userMedia
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
  };

  const onClickCameraFn = () => {
    userMedia
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
          ref={videoRef}
          autoPlay
          playsInline
          width={400}
          height={400}
        ></video>
        <video
          ref={opponentVideoRef}
          autoPlay
          playsInline
          width={400}
          height={400}
        ></video>
        <div>
          <button onClick={onClickMuteFn}>mute</button>
          <button onClick={onClickCameraFn}>camera</button>

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
