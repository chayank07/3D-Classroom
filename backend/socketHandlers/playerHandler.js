// Prompt: Add a new listener to this file, after the 'playerMove' listener.
// 1. Create a new listener for 'playerRaiseHand'. It will receive a 'handRaised' (boolean) value.
// 2. Get the 'roomName' from 'socket.roomName'.
// 3. If the room exists, update the player's state: rooms[roomName][socket.id].handRaised = handRaised;
// 4. Broadcast 'playerHandRaised' to everyone *else* in the room.
// 5. Send an object with the player's id and new hand status: { id: socket.id, handRaised: handRaised }

module.exports = (io, socket) => {
	// Listen for player movement updates from a client
	socket.on('playerMove', (position, rotation) => {
		const room = socket.roomName;
		if (!room) return;

		// Broadcast the player's new transform to others in the same room
		socket.to(room).emit('playerMoved', {
			id: socket.id,
			position,
			rotation,
		});
	});

	// Listen for player hand raise toggles
	socket.on('playerRaiseHand', (handRaised) => {
		const room = socket.roomName;
		if (!room) return;

		// require the roomHandler module to access the shared rooms object
		try {
			const roomModule = require('./roomHandler');
			const rooms = roomModule.rooms;
			if (!rooms || !rooms[room] || !rooms[room][socket.id]) return;

			// Update the player's hand state
			rooms[room][socket.id].handRaised = handRaised;

			// Broadcast the player's hand state to others in the same room
			socket.to(room).emit('playerHandRaised', {
				id: socket.id,
				handRaised: handRaised
			});
		} catch (e) {
			console.error('Error in playerRaiseHand:', e);
		}
	});

	// --- NEW FEATURE: EMOTION DETECTION ---
	// Listen for player emotion updates
	socket.on('playerUpdateEmotion', (mood) => {
		const room = socket.roomName;
		if (!room) return;
		
		// Basic validation
		if (typeof mood !== 'string') return;

		try {
			const roomModule = require('./roomHandler');
			const rooms = roomModule.rooms;
			if (!rooms || !rooms[room] || !rooms[room][socket.id]) return;

			// Update the player's mood in the server state
			rooms[room][socket.id].mood = mood;

			// Broadcast the new mood to everyone else in the room
			socket.to(room).emit('playerMoodUpdated', {
				id: socket.id,
				mood: mood
			});
		} catch (e) {
			console.error('Error in playerUpdateEmotion:', e);
		}
	});
	// --- END NEW FEATURE ---
};