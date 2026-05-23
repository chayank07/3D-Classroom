import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import AudioPlayer from './AudioPlayer';

const peerConfig = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    },
};

const AudioManager = ({ socket, players, isMuted, roomName }) => {
    const [remoteStreams, setRemoteStreams] = useState([]);
    
    // Logic Refs
    const localStreamRef = useRef(null);
    const peersRef = useRef({});
    const streamLoadedRef = useRef(false); // <--- NEW: Prevent double-init
    const [streamReady, setStreamReady] = useState(false); // Trigger re-render for mute logic

    // --- 1. MUTE LOGIC ---
    useEffect(() => {
        if (localStreamRef.current) {
            const tracks = localStreamRef.current.getAudioTracks();
            tracks.forEach(track => {
                track.enabled = !isMuted;
            });
            console.log(`Audio Manager: Microphone is now ${isMuted ? 'MUTED' : 'UNMUTED'}`);
        }
    }, [isMuted, streamReady]); 

    // --- 2. CONNECTION LOGIC ---
    useEffect(() => {
        if (!socket || !roomName) return;

        const createPeer = (peerId, initiator) => {
            if (!localStreamRef.current) {
                console.warn("Attempted to create peer without local stream");
                return null;
            }

            // Create peer
            const peer = new Peer({
                initiator: initiator,
                trickle: true,
                stream: localStreamRef.current,
                ...peerConfig,
            });

            // Handle Signals
            peer.on('signal', signal => {
                if (peer.destroyed) return; // Guard against destroyed peers
                socket.emit('relay-audio-signal', {
                    to: peerId,
                    signal: signal,
                });
            });

            // Handle Stream
            peer.on('stream', stream => {
                setRemoteStreams(prev => {
                    if (!prev.find(p => p.peerId === peerId)) {
                        return [...prev, { peerId, stream }];
                    }
                    return prev;
                });
            });

            // Handle Errors
            peer.on('error', err => {
                console.warn(`Peer error with ${peerId}:`, err.message);
                // Don't throw, just log. InvalidStateError is common in fast reloads.
            });

            return peer;
        };

        // --- STARTUP ---
        const initAudio = async () => {
            // Prevent running this twice
            if (streamLoadedRef.current) return;
            streamLoadedRef.current = true;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                console.log('Microphone acquired.');
                
                localStreamRef.current = stream;
                setStreamReady(true); // Trigger mute check
                
                // Join Voice Channel
                socket.emit('join-voice', roomName);

            } catch (err) {
                console.error('Failed to get mic:', err);
                streamLoadedRef.current = false; // Allow retry if failed
            }
        };

        initAudio();

        // --- SOCKET HANDLERS ---
        const handleAllVoicePeers = ({ peerIds }) => {
            peerIds.forEach(id => {
                // Only create if not exists
                if (!peersRef.current[id]) {
                    const peer = createPeer(id, true);
                    if (peer) peersRef.current[id] = peer;
                }
            });
        };

        const handleNewVoicePeer = ({ peerId }) => {
            if (!peersRef.current[peerId]) {
                const peer = createPeer(peerId, false);
                if (peer) peersRef.current[peerId] = peer;
            }
        };

        const handleAudioSignalReceived = ({ from, signal }) => {
            const peer = peersRef.current[from];
            if (peer && !peer.destroyed) {
                try {
                    peer.signal(signal);
                } catch (e) {
                    console.warn(`Signal failed for peer ${from}:`, e.message);
                }
            }
        };

        const handleVoicePeerLeft = ({ peerId }) => {
            if (peersRef.current[peerId]) {
                peersRef.current[peerId].destroy();
                delete peersRef.current[peerId];
            }
            setRemoteStreams(prev => prev.filter(p => p.peerId !== peerId));
        };

        // Register Listeners
        socket.on('all-voice-peers', handleAllVoicePeers);
        socket.on('new-voice-peer', handleNewVoicePeer);
        socket.on('audio-signal-received', handleAudioSignalReceived);
        socket.on('peer-left-voice', handleVoicePeerLeft);

        // --- CLEANUP ---
        return () => {
            // Unregister listeners
            socket.off('all-voice-peers', handleAllVoicePeers);
            socket.off('new-voice-peer', handleNewVoicePeer);
            socket.off('audio-signal-received', handleAudioSignalReceived);
            socket.off('peer-left-voice', handleVoicePeerLeft);
            
            // Leave voice channel
            socket.emit('leave-voice');
            
            // Cleanup Peers
            Object.values(peersRef.current).forEach(peer => {
                if (peer) peer.destroy();
            });
            peersRef.current = {};
            setRemoteStreams([]);

            // Cleanup Stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
                streamLoadedRef.current = false; // Reset for next mount
            }
        };
    }, [socket, roomName]);

    return (
        <>
            {remoteStreams.map(data => (
                <AudioPlayer
                    key={data.peerId}
                    peerId={data.peerId}
                    stream={data.stream}
                    players={players}
                    myId={socket ? socket.id : null}
                />
            ))}
        </>
    );
};

export default AudioManager;