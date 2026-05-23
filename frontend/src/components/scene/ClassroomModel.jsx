import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ClassroomModel = ({ videoRef, screenStream }) => {
    const [texture, setTexture] = useState(null);
    const texRef = useRef(null); // Keep a ref to dispose old textures

    useEffect(() => {
        if (videoRef.current && screenStream) {
            // A stream is active, and we have a video element
            const video = videoRef.current;

            // This is the fix. We wait for the 'onplaying' event.
            const onVideoPlaying = () => {
                console.log('BOARD: Video is playing! Creating texture.');
                
                // Dispose the old texture if it exists
                if (texRef.current) {
                    texRef.current.dispose();
                }

                // Create the new texture
                const tex = new THREE.VideoTexture(video);
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.format = THREE.RGBAFormat;
                tex.center.set(0.5, 0.5);
                tex.repeat.set(-1, 1);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.generateMipmaps = false;
                
                texRef.current = tex; // Store ref
                setTexture(tex); // Set state to re-render
            };

            // Add the listener
            video.addEventListener('playing', onVideoPlaying);

            // Clean up: remove listener when effect re-runs or unmounts
            return () => {
                video.removeEventListener('playing', onVideoPlaying);
                
                // Also clean up the texture itself
                if (texRef.current) {
                    texRef.current.dispose();
                    texRef.current = null;
                }
                setTexture(null);
            };
        } else {
            // No stream, so dispose texture
            if (texRef.current) {
                texRef.current.dispose();
                texRef.current = null;
            }
            setTexture(null);
        }
    }, [videoRef, screenStream]); // This effect runs when the stream starts or stops

    // This useFrame is still needed to update the texture every frame
    useFrame(() => {
        if (texture) {
            texture.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#888888" />
            </mesh>

            {/* Walls */}
            <mesh position={[0, 23, 25]}> {/* Back Wall */}
                <boxGeometry args={[100, 50, 0.2]} />
                <meshStandardMaterial color="#ADD8E6" />
            </mesh>
            <mesh position={[0, 23, -25]}> {/* Front Wall */}
                <boxGeometry args={[100, 50, 0.2]} />
                <meshStandardMaterial color="#ADD8E6" />
            </mesh>
            <mesh position={[-50, 23, 0]} rotation={[0, Math.PI / 2, 0]}> {/* Left Wall */}
                <boxGeometry args={[50, 50, 0.2]} />
                <meshStandardMaterial color="#E0FFFF" />
            </mesh>
            <mesh position={[50, 23, 0]} rotation={[0, Math.PI / 2, 0]}> {/* Right Wall */}
                <boxGeometry args={[50, 50, 0.2]} />
                <meshStandardMaterial color="#E0FFFF" />
            </mesh>

            {/* Stage */}
            <mesh position={[0, -1.5, 20]}>
                <boxGeometry args={[40, 1, 10]} />
                <meshStandardMaterial color="#D2B48C" />
            </mesh>

            {/* Desks (Moved to -15) */}
            <mesh position={[-10, -1, -15]}>
                <boxGeometry args={[4, 2, 2]} />
                <meshStandardMaterial color="#A0522D" />
            </mesh>
            <mesh position={[10, -1, -15]}>
                <boxGeometry args={[4, 2, 2]} />
                <meshStandardMaterial color="#A0522D" />
            </mesh>
            <mesh position={[0, -1, -15]}>
                <boxGeometry args={[4, 2, 2]} />
                <meshStandardMaterial color="#A0522D" />
            </mesh>
            <mesh position={[0, 0.5, -15.5]}> {/* Desk top */}
                <boxGeometry args={[4, 0.2, 1]} />
                <meshStandardMaterial color="#CD853F" />
            </mesh>

            {/* Blackboard Assembly */}
            <mesh position={[0, 10, 24.8]}>
                <planeGeometry args={[30, 15]} />
                <meshBasicMaterial 
                    map={texture}
                    color={texture ? "#ffffff" : "#224422"} // Show green if no texture
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Blackboard Frame (Dark Wood) */}
            <mesh position={[0, 17.6, 24.7]}>
                <boxGeometry args={[30.4, 0.2, 0.2]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 2.4, 24.7]}>
                <boxGeometry args={[30.4, 0.2, 0.2]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[-15.1, 10, 24.7]}>
                <boxGeometry args={[0.2, 15.4, 0.2]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[15.1, 10, 24.7]}>
                <boxGeometry args={[0.2, 15.4, 0.2]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
        </group>
    );
};

export default ClassroomModel;