import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3002';
//const SOCKET_URL = 'https://x7gqb2sq-3002.inc1.devtunnels.ms';

export default function useSocket() {
	const socketRef = useRef(null);
	const [socket, setSocket] = useState(null);

	useEffect(() => {
		// Create the socket connection
		socketRef.current = io(SOCKET_URL);
		const s = socketRef.current;
		setSocket(s);

		const handleConnect = () => {
			console.log(`Socket connected: ${s.id}`);
		};

		const handleDisconnect = () => {
			console.log('Socket disconnected');
		};

		s.on('connect', handleConnect);
		s.on('disconnect', handleDisconnect);

		// Cleanup on unmount
		return () => {
			if (s) {
				s.off('connect', handleConnect);
				s.off('disconnect', handleDisconnect);
				s.disconnect();
			}
			setSocket(null);
		};
	}, []);

	return socket;
}