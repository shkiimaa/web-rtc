import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8080');

const IOtest: React.FC = () => {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isConnected) {
      socket.emit('join-room', roomId, socket.id);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setMyStream(stream);
          if (myVideo.current) {
            myVideo.current.srcObject = stream;
          }
        });

      socket.on('user-connected', (userId: string) => {
        callUser(userId);
      });

      socket.on('user-disconnected', () => {
        setRemoteStream(null);
        if (remoteVideo.current) remoteVideo.current.srcObject = null;
      });

      socket.on(
        'receive-offer',
        (offer: RTCSessionDescriptionInit, userId: string) => {
          handleReceiveOffer(offer, userId);
        }
      );

      socket.on('receive-answer', (answer: RTCSessionDescriptionInit) => {
        handleReceiveAnswer(answer);
      });

      socket.on('receive-ice-candidate', (candidate: RTCIceCandidateInit) => {
        handleReceiveIceCandidate(candidate);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isConnected, roomId]);

  const callUser = (userId: string) => {
    const pc = createPeerConnection(userId);

    myStream?.getTracks().forEach((track) => pc.addTrack(track, myStream));

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit('send-offer', userId, pc.localDescription);
      });

    setPeerConnection(pc);
  };

  const handleReceiveOffer = (
    offer: RTCSessionDescriptionInit,
    userId: string
  ) => {
    const pc = createPeerConnection(userId);

    pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        socket.emit('send-answer', userId, pc.localDescription);
      });

    setPeerConnection(pc);
  };

  const handleReceiveAnswer = (answer: RTCSessionDescriptionInit) => {
    peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleReceiveIceCandidate = (candidate: RTCIceCandidateInit) => {
    peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('send-ice-candidate', userId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const handleJoinRoom = () => {
    setIsConnected(true);
  };

  const changeCamera = () => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      );
      const currentDeviceId = myStream
        ?.getVideoTracks()[0]
        .getSettings().deviceId;
      const newDevice = videoDevices.find(
        (device) => device.deviceId !== currentDeviceId
      );
      if (newDevice) {
        navigator.mediaDevices
          .getUserMedia({ video: { deviceId: newDevice.deviceId } })
          .then((newStream) => {
            const newVideoTrack = newStream.getVideoTracks()[0];
            const sender = peerConnection
              ?.getSenders()
              .find((s) => s.track?.kind === 'video');
            sender?.replaceTrack(newVideoTrack);

            myStream?.getTracks().forEach((track) => track.stop());
            setMyStream(newStream);
            if (myVideo.current) {
              myVideo.current.srcObject = newStream;
            }
          });
      }
    });
  };

  return (
    <div>
      {!isConnected ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h1>Room ID: {roomId}</h1>
          <video ref={myVideo} autoPlay playsInline muted></video>
          <video ref={remoteVideo} autoPlay playsInline></video>
          <button onClick={changeCamera}>Change Camera</button>
        </div>
      )}
    </div>
  );
};

export default IOtest;
