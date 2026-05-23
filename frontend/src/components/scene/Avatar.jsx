import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, Billboard } from '@react-three/drei'; // <--- Added Text, Billboard
import * as THREE from 'three';

// --- Helper: Create a semi-circle shape for the smile ---
const smileShape = new THREE.Shape();
smileShape.moveTo(-0.35, 0); 
smileShape.bezierCurveTo(-0.2, -0.15, 0.2, -0.15, 0.35, 0); 
smileShape.bezierCurveTo(0.2, -0.05, -0.2, -0.05, -0.35, 0); 
const smileGeometry = new THREE.ShapeGeometry(smileShape);
smileGeometry.center();

// --- ACCEPT headYaw AND userName PROPS ---
const Avatar = ({ 
    id, 
    socket, 
    position, 
    rotation, 
    handRaised = false, 
    mood = 'neutral', 
    isHost = false, 
    color, 
    headYaw = 0,
    userName // <--- NEW: Receive the name here
}) => {
    const groupRef = useRef();
    
    // Body Parts Refs
    const headRef = useRef();
    const bodyRef = useRef();
    const leftArmRef = useRef();
    const rightArmRef = useRef(); 
    const leftLegRef = useRef();
    const rightLegRef = useRef();

    // Facial Features
    const leftEyeRef = useRef();
    const rightEyeRef = useRef();
    const mouthGroupRef = useRef(); 
    const mouthNeutralRef = useRef();
    const mouthHappyRef = useRef();   
    const mouthSurprisedRef = useRef();
    const leftTearRef = useRef();
    const rightTearRef = useRef();

    const isLocalPlayer = socket && socket.id === id;

    // Animation Variables
    const targetEyeScaleY = useRef(1.0);
    const targetEyeScaleX = useRef(1.0);
    const targetTearScale = useRef(0);
    const targetRotation = useRef(new THREE.Quaternion());
    
    const prevPos = useRef(new THREE.Vector3(0, 0, 0));
    const isWalking = useRef(false);

    useFrame((state, delta) => {
        if (delta === 0 || isNaN(delta)) return;
        
        // --- 1. MOOD LOGIC ---
        if (mouthNeutralRef.current) mouthNeutralRef.current.visible = false;
        if (mouthHappyRef.current) mouthHappyRef.current.visible = false;
        if (mouthSurprisedRef.current) mouthSurprisedRef.current.visible = false;
        targetTearScale.current = 0;
        
        let mouthYPos = 0.75; 
        let mouthScaleY = 1.0;
        let mouthScaleX = 1.0;

        switch (mood) {
            case 'happy':
                targetEyeScaleY.current = 0.7; targetEyeScaleX.current = 1.0;
                if (mouthHappyRef.current) mouthHappyRef.current.visible = true;
                mouthYPos = 0.78;
                break;
            case 'surprised':
                targetEyeScaleY.current = 1.4; targetEyeScaleX.current = 1.2;
                if (mouthSurprisedRef.current) mouthSurprisedRef.current.visible = true;
                mouthYPos = 0.7;
                break;
            case 'sad':
                targetEyeScaleY.current = 0.4; targetEyeScaleX.current = 0.8;
                if (mouthNeutralRef.current) mouthNeutralRef.current.visible = true;
                mouthScaleX = 1.4; mouthScaleY = 0.5; mouthYPos = 0.7;
                targetTearScale.current = 1.0;
                break;
            case 'angry':
                targetEyeScaleY.current = 0.5; targetEyeScaleX.current = 1.1;
                if (mouthNeutralRef.current) mouthNeutralRef.current.visible = true;
                mouthScaleX = 1.2; mouthScaleY = 0.2; mouthYPos = 0.75;
                break;
            case 'neutral':
            default:
                targetEyeScaleY.current = 1.0; targetEyeScaleX.current = 1.0;
                if (mouthNeutralRef.current) mouthNeutralRef.current.visible = true;
                mouthScaleX = 1.0; mouthScaleY = 0.5; mouthYPos = 0.75;
                break;
        }

        // --- 2. BLINKING ---
        const blinkTime = state.clock.elapsedTime % 5;
        const isBlinking = blinkTime > 4.8;
        const finalEyeScaleY = isBlinking ? 0.1 : targetEyeScaleY.current;
        const finalEyeScaleX = targetEyeScaleX.current;
        
        // --- 3. APPLY EMOTION LERPS ---
        const lerpSpeed = delta * 15;
        if (leftEyeRef.current) {
            leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, finalEyeScaleY, lerpSpeed);
            leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, finalEyeScaleX, lerpSpeed);
        }
        if (rightEyeRef.current) {
            rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, finalEyeScaleY, lerpSpeed);
            rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, finalEyeScaleX, lerpSpeed);
        }
        if (mouthNeutralRef.current) {
            mouthNeutralRef.current.scale.x = THREE.MathUtils.lerp(mouthNeutralRef.current.scale.x, mouthScaleX, lerpSpeed);
            mouthNeutralRef.current.scale.y = THREE.MathUtils.lerp(mouthNeutralRef.current.scale.y, mouthScaleY, lerpSpeed);
        }
        if (mouthGroupRef.current) {
            mouthGroupRef.current.position.y = THREE.MathUtils.lerp(mouthGroupRef.current.position.y, mouthYPos - 1.0, lerpSpeed); 
        }
        if (leftTearRef.current) leftTearRef.current.scale.y = THREE.MathUtils.lerp(leftTearRef.current.scale.y, targetTearScale.current, lerpSpeed);
        if (rightTearRef.current) rightTearRef.current.scale.y = THREE.MathUtils.lerp(rightTearRef.current.scale.y, targetTearScale.current, lerpSpeed);


        // --- 4. POSITION & ROTATION ---
        if (!groupRef.current) return;

        let currentPos = groupRef.current.position;
        
        if (!isLocalPlayer && position) {
            const targetPos = new THREE.Vector3(position.x, position.y, position.z);
            currentPos.lerp(targetPos, delta * 15);
            targetRotation.current.setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
            groupRef.current.quaternion.slerp(targetRotation.current, delta * 15);
        }

        // --- 5. ANIMATION & HEAD ROTATION ---
        const speed = currentPos.distanceTo(prevPos.current) / delta;
        isWalking.current = speed > 0.1;
        prevPos.current.copy(currentPos);

        const time = state.clock.elapsedTime;

        // --- NEW: HEAD ROTATION ---
        if (headRef.current) {
            const targetHeadY = headYaw || 0; 
            const bobbingY = isWalking.current ? (1.0 + Math.sin(time * 20) * 0.05) : 1.0;
            
            // Smoothly rotate head
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadY, delta * 5);
            headRef.current.position.y = bobbingY;
        }

        if (isWalking.current) {
            // WALKING
            const walkSpeed = 10;
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * walkSpeed) * 0.5;
            if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.5;
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.5;
            if (rightArmRef.current && !handRaised) {
                rightArmRef.current.rotation.x = Math.sin(time * walkSpeed) * 0.5;
            }
            if (bodyRef.current) bodyRef.current.position.y = -0.5 + Math.sin(time * 20) * 0.05;

        } else {
            // IDLE
            if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 5);
            if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 5);
            if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, delta * 5);
            if (rightArmRef.current && !handRaised) {
                rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, delta * 5);
            }
            if (bodyRef.current) {
                bodyRef.current.position.y = -0.5;
                bodyRef.current.scale.y = 1 + Math.sin(time * 2) * 0.02;
                bodyRef.current.scale.x = 1 + Math.cos(time * 2) * 0.01;
            }
        }
        
        if (rightArmRef.current) {
            const targetRotationZ = handRaised ? Math.PI * 0.75 : 0;
            rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRotationZ, delta * 5);
            if(handRaised) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, delta * 5);
        }
    });

    const avatarColor = color || (isHost ? 'gold' : (isLocalPlayer ? 'blue' : 'red'));
    const initialPosition = position && typeof position.x === 'number' ? [position.x, position.y, position.z] : [0, 0, 0];
    const initialRotation = rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0];

    return (
        <group ref={groupRef} position={initialPosition} rotation={initialRotation}>
            
            {/* --- NEW: 3D NAMETAG --- */}
            <Billboard position={[0, 2.3, 0]}>
                <Text
                    fontSize={0.25}
                    color={isHost ? "#FFD700" : "white"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {isHost ? `(Teacher) ${userName}` : userName}
                </Text>
            </Billboard>

            {mood && mood !== 'neutral' && (
                <Html position={[0, 1.7, 0]} center>
                    <div style={{ padding: '2px 5px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '3px', fontSize: '12px', textTransform: 'capitalize' }}>
                        {mood}
                    </div>
                </Html>
            )}

            {/* --- HEAD GROUP --- */}
            <group ref={headRef} position={[0, 1.0, 0]}>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color={avatarColor} />
                </mesh>
                <mesh ref={leftEyeRef} position={[-0.2, 0.1, 0.5]}>
                    <boxGeometry args={[0.1, 0.2, 0.1]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh ref={rightEyeRef} position={[0.2, 0.1, 0.5]}>
                    <boxGeometry args={[0.1, 0.2, 0.1]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh ref={leftTearRef} position={[-0.2, -0.1, 0.5]} scale-y={0}>
                    <coneGeometry args={[0.04, 0.2, 8]} />
                    <meshStandardMaterial color="#6495ED" transparent={true} opacity={0.8} />
                </mesh>
                <mesh ref={rightTearRef} position={[0.2, -0.1, 0.5]} scale-y={0}>
                    <coneGeometry args={[0.04, 0.2, 8]} />
                    <meshStandardMaterial color="#6495ED" transparent={true} opacity={0.8} />
                </mesh>
                <group ref={mouthGroupRef} position={[0, -0.25, 0.5]}>
                    <mesh ref={mouthNeutralRef} scale={[0.5, 0.1, 0.1]} visible={false}>
                        <boxGeometry args={[0.5, 0.1, 0.1]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <mesh ref={mouthHappyRef} geometry={smileGeometry} scale={0.6} visible={false}>
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <mesh ref={mouthSurprisedRef} scale={0.2} visible={false}>
                        <circleGeometry args={[1, 24]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                </group>
            </group>

            {/* --- BODY --- */}
            <mesh ref={bodyRef} position={[0, -0.5, 0]}>
                <boxGeometry args={[1, 1, 0.5]} />
                <meshStandardMaterial color={avatarColor} />
            </mesh>

            {/* --- LIMBS --- */}
            <group ref={leftArmRef} position={[-0.75, 0, 0]}> 
                <mesh position={[0, -0.5, 0]}>
                    <boxGeometry args={[0.5, 1, 0.5]} />
                    <meshStandardMaterial color="#AAAAAA" />
                </mesh>
            </group>
            <group ref={rightArmRef} position={[0.75, 0, 0]}>
                <mesh position={[0, -0.5, 0]}>
                    <boxGeometry args={[0.5, 1, 0.5]} />
                    <meshStandardMaterial color="#AAAAAA" />
                </mesh>
            </group>
            <group ref={leftLegRef} position={[-0.25, -1.0, 0]}>
                <mesh position={[0, -0.5, 0]}>
                    <boxGeometry args={[0.5, 1, 0.5]} />
                    <meshStandardMaterial color="#555555" />
                </mesh>
            </group>
            <group ref={rightLegRef} position={[0.25, -1.0, 0]}>
                 <mesh position={[0, -0.5, 0]}>
                    <boxGeometry args={[0.5, 1, 0.5]} />
                    <meshStandardMaterial color="#555555" />
                </mesh>
            </group>
        </group>
    );
};

export default Avatar;