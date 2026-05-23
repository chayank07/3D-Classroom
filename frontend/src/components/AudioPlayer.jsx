import React, { useEffect, useRef } from 'react';

// This component plays a single remote audio stream and handles spatial volume
const AudioPlayer = ({ peerId, stream, players, myId }) => {
    const audioRef = useRef(null);

    // 1. When the component mounts, attach the stream to the <audio> element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    // 2. This effect runs every time the 'players' object (positions) changes
    useEffect(() => {
        if (!audioRef.current || !players || !myId || !players[myId] || !players[peerId]) {
            return; // Not all data is ready
        }

        const myPosition = players[myId].position;
        const remotePosition = players[peerId].position;

        if (!myPosition || !remotePosition) {
            return; // Player positions are not set
        }

        // Calculate 2D distance (X and Z)
        const dx = myPosition.x - remotePosition.x;
        const dz = myPosition.z - remotePosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Define audio range
        const maxDistance = 30; // At 30 units away, volume is 0
        const minDistance = 2;  // Closer than 2 units, volume is 1 (max)

        let volume = 0;
        if (distance < minDistance) {
            volume = 1;
        } else if (distance > maxDistance) {
            volume = 0;
        } else {
            // Calculate a linear falloff
            volume = 1 - ((distance - minDistance) / (maxDistance - minDistance));
        }

        audioRef.current.volume = volume;

    }, [players, myId, peerId, stream]); // Re-run when player positions change

    return (
        <audio ref={audioRef} autoPlay />
    );
};

export default AudioPlayer;