const rooms = {};

const registerRoomHandlers = (io, socket) => {
  // --- CREATE ROOM (TEACHER) ---
  socket.on('createRoom', (roomName, userName, avatarColor) => {
    rooms[roomName] = {};
    
    const player = {
      id: socket.id,
      userName,
      isHost: true,
      color: avatarColor || 'gold',
      position: { x: 0, y: 0, z: 20 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      handRaised: false,
      mood: 'neutral',
      headYaw: 0,
      attention: 'Focused'
    };
    
    rooms[roomName][socket.id] = player;
    socket.roomName = roomName;
    socket.join(roomName);
    socket.emit('currentPlayers', rooms[roomName]);
  });

  // --- JOIN ROOM (STUDENT) ---
  socket.on('joinRoom', (roomName, userName, avatarColor) => {
    if (!rooms[roomName]) {
      socket.emit('error', 'Room not found');
      return;
    }

    const player = {
      id: socket.id,
      userName,
      isHost: false,
      color: avatarColor || 'blue',
      position: { x: 0, y: 0, z: -10 },
      rotation: { x: 0, y: 0, z: 0 },
      handRaised: false,
      mood: 'neutral',
      headYaw: 0,
      attention: 'Focused'
    };

    rooms[roomName][socket.id] = player;
    socket.roomName = roomName;
    socket.join(roomName);
    socket.emit('currentPlayers', rooms[roomName]);
    socket.to(roomName).emit('newPlayer', player);
  });

  // --- PRIVACY FIX: STATUS UPDATE ---
  socket.on('playerUpdateStatus', ({ mood, headYaw, attention }) => {
    const roomName = socket.roomName;
    if (!roomName || !rooms[roomName] || !rooms[roomName][socket.id]) return;

    // 1. Update data in server memory
    const player = rooms[roomName][socket.id];
    player.mood = mood;
    player.headYaw = headYaw;
    player.attention = attention;

    const statusPayload = { 
        id: socket.id, 
        mood, 
        headYaw,
        attention 
    };

    // 2. Find the Teacher (Host)
    const playersInRoom = rooms[roomName];
    const teacher = Object.values(playersInRoom).find(p => p.isHost);

    // 3. Send ONLY to Teacher
    if (teacher) {
        io.to(teacher.id).emit('playerStatusUpdated', statusPayload);
    }

    // 4. Send back to YOURSELF (Optional: keeps your local avatar synced)
    // If you strictly don't want the student to see it either, remove this line.
    socket.emit('playerStatusUpdated', statusPayload);
  });

  // --- PLAYER MOVEMENT ---
  socket.on('playerMove', (position, rotation) => {
    const roomName = socket.roomName;
    if (!roomName || !rooms[roomName] || !rooms[roomName][socket.id]) return;

    const player = rooms[roomName][socket.id];
    player.position = position;
    player.rotation = rotation;

    socket.to(roomName).emit('playerMoved', { id: socket.id, position, rotation });
  });

  // --- RAISE HAND ---
  socket.on('playerRaiseHand', (handRaised) => {
    const roomName = socket.roomName;
    if (!roomName || !rooms[roomName] || !rooms[roomName][socket.id]) return;

    rooms[roomName][socket.id].handRaised = handRaised;
    io.to(roomName).emit('playerHandRaised', { id: socket.id, handRaised });
  });

  // --- END CLASS ---
  socket.on('end-class', (roomName) => {
      if (rooms[roomName]) {
          io.to(roomName).emit('class-ended');
      }
  });
  
  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    const roomName = socket.roomName;
    if (!roomName || !rooms[roomName]) return;

    delete rooms[roomName][socket.id];
    io.to(roomName).emit('playerDisconnected', socket.id);

    if (rooms[roomName] && Object.keys(rooms[roomName]).length === 0) {
      delete rooms[roomName];
    }
  });
};

module.exports = registerRoomHandlers;
module.exports.rooms = rooms;