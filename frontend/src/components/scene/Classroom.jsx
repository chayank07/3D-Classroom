import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import useSocket from '../../hooks/useSocket';
import { useKeyboardControls } from '@react-three/drei';
import Experience from './Experience';
import Avatar from './Avatar';
import RobotTutor from './RobotTutor'; // <--- Restored Import
import TeacherUI from '../ui/TeacherUI';
import StudentUI from '../ui/StudentUI';
import AudioManager from '../AudioManager';

const Classroom = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const userName = state.userName || 'Anonymous';
  const asHost = !!state.asHost;
  const avatarColor = state.avatarColor;

  const socket = useSocket();
  const [players, setPlayers] = useState({});
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false); // Audio Gating
  
  const [isMuted, setIsMuted] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const videoRef = useRef(null);

  const [sub, get] = useKeyboardControls();
  const prevHandPressed = useRef(false);

  const toggleHand = useCallback(() => {
    const next = !myHandRaised;
    setMyHandRaised(next);
    try {
      if (socket && socket.connected) socket.emit('playerRaiseHand', next);
    } catch { }
  }, [myHandRaised, socket]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleEndClass = useCallback(() => {
    if (window.confirm("Are you sure you want to end the class for everyone?")) {
        if (socket && socket.connected) {
            socket.emit('end-class', roomName);
        }
    }
  }, [socket, roomName]);

  useEffect(() => {
    if (!sub) return;
    let unsubscribe;
    try {
      unsubscribe = sub(
        (s) => s.hand,
        (pressed) => {
          if (pressed && !prevHandPressed.current) toggleHand();
          prevHandPressed.current = pressed;
        }
      );
    } catch {
      unsubscribe = sub((s) => {
        const pressed = !!s.hand;
        if (pressed && !prevHandPressed.current) toggleHand();
        prevHandPressed.current = pressed;
      });
    }
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [sub, toggleHand]);

  useEffect(() => {
    if (!socket) return;

    const handleCurrent = (current) => {
        setPlayers(current || {});
        setRoomJoined(true); // Enable Audio
    };

    const handleNew = (player) => setPlayers((p) => ({ ...p, [player.id]: player }));
    const handleDisconnect = (id) => {
      setPlayers((p) => { const copy = { ...p }; delete copy[id]; return copy; });
    };
    const handleMoved = ({ id, position, rotation }) => setPlayers((p) => ({ ...p, [id]: { ...p[id], position, rotation } }));
    const handleHand = ({ id, handRaised }) => setPlayers((p) => ({ ...p, [id]: { ...p[id], handRaised } }));
    const handleError = (msg) => console.warn('Socket error:', msg);
    
    const handleStatusUpdated = ({ id, mood, headYaw, attention }) => {
        setPlayers((p) => ({ 
            ...p, 
            [id]: { ...p[id], mood, headYaw, attention } 
        }));
    };

    const handleClassEnded = () => {
        alert("The teacher has ended the class.");
        navigate('/'); 
    };
    
    socket.on('currentPlayers', handleCurrent);
    socket.on('newPlayer', handleNew);
    socket.on('playerDisconnected', handleDisconnect);
    socket.on('playerMoved', handleMoved);
    socket.on('playerHandRaised', handleHand);
    socket.on('error', handleError);
    socket.on('playerStatusUpdated', handleStatusUpdated);
    socket.on('class-ended', handleClassEnded); 

    try {
      if (asHost) {
          socket.emit('createRoom', roomName, userName, avatarColor);
      } else {
          socket.emit('joinRoom', roomName, userName, avatarColor);
      }
    } catch { }

    return () => {
      socket.off('currentPlayers', handleCurrent);
      socket.off('newPlayer', handleNew);
      socket.off('playerDisconnected', handleDisconnect);
      socket.off('playerMoved', handleMoved);
      socket.off('playerHandRaised', handleHand);
      socket.off('error', handleError);
      socket.off('playerStatusUpdated', handleStatusUpdated);
      socket.off('class-ended', handleClassEnded); 
    };
  }, [socket, roomName, userName, asHost, avatarColor, navigate]);

  function MovementController({ get, socketRef, asHostFlag, playersRef, setPlayersRef }) {
    useFrame(() => {
      const socketLocal = socketRef;
      if (!socketLocal || (!asHostFlag && !playersRef[socketLocal.id])) return;
      const { forward, backward, leftward, rightward } = get();
      if (forward || backward || leftward || rightward) {
        setPlayersRef((prev) => {
          if (!prev[socketLocal.id]) return prev;
          const me = { ...prev[socketLocal.id] }; 
          me.position = { ...prev[socketLocal.id].position }; 
          me.rotation = { ...prev[socketLocal.id].rotation }; 
          
          if (forward) me.position.z -= 0.05;
          if (backward) me.position.z += 0.05;
          if (leftward) me.position.x -= 0.05;
          if (rightward) me.position.x += 0.05;
          try { socketLocal.emit('playerMove', me.position, me.rotation); } catch { }
          return { ...prev, [socketLocal.id]: me };
        });
      }
    });
    return null;
  }

  const startScreenShare = useCallback(async () => {
    if (screenStream) {
      if (videoRef.current) videoRef.current.srcObject = null;
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((e) => console.warn('video play failed:', e));
        };
        setTimeout(() => {
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
        }, 200);
      }
      setScreenStream(stream);
    } catch {
      console.warn('Screen share failed or was cancelled');
    }
  }, [screenStream]);

  return (
    <div className="classroom-container" style={{ width: '100%', height: '100vh' }}>
      
      {/* Audio Manager (Gated) */}
      {socket && roomJoined && (
          <AudioManager 
              socket={socket} 
              players={players} 
              isMuted={isMuted} 
              roomName={roomName}
          />
      )}

      <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

      <Canvas camera={{ position: [0, 5, 20], fov: 60 }}>
        <Suspense fallback={null}>
          <Experience videoRef={videoRef} screenStream={screenStream} /> 
          
          {/* --- ROBOT TUTOR IS BACK --- */}
          <RobotTutor position={[12, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

          {Object.values(players).map((player) => {
            const isMe = socket && socket.id === player.id;
            return (
              <Avatar
                key={player.id}
                id={player.id}
                socket={socket}
                position={player.position}
                rotation={player.rotation}
                handRaised={isMe ? myHandRaised : player.handRaised}
                isHost={player.isHost}
                mood={player.mood || 'neutral'}
                color={isMe ? avatarColor : player.color}
                headYaw={player.headYaw || 0}
                userName={player.userName} 
              />
            );
          })}
          <MovementController get={get} socketRef={socket} asHostFlag={asHost} playersRef={players} setPlayersRef={setPlayers} />
        </Suspense>
      </Canvas>

      {asHost ? (
        <TeacherUI 
            players={players} 
            onShareScreen={startScreenShare} 
            onToggleMute={toggleMute}
            isMuted={isMuted}
            onEndClass={handleEndClass} 
        />
      ) : (
        <StudentUI 
            onRaiseHand={toggleHand} 
            handRaised={myHandRaised} 
            socket={socket}
            onToggleMute={toggleMute}
            isMuted={isMuted}
        />
      )}
    </div>
  );
};

export default Classroom;