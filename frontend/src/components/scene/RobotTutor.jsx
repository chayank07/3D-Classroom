import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

const RobotTutor = ({ position = [12, 0, 0], rotation = [0, -Math.PI / 2, 0] }) => {
    // We now have TWO refs: one for the whole container, one just for the robot body
    const robotBody = useRef(); 
    
    const [robotState, setRobotState] = useState('IDLE'); 
    const [chatVisible, setChatVisible] = useState(false);
    const [userText, setUserText] = useState("");
    const [robotReply, setRobotReply] = useState("Press 'T' to chat");

    const colors = {
        IDLE: '#00ccff',      
        THINKING: '#ffff00',  
        SPEAKING: '#33ff33'   
    };

    useFrame((state) => {
        if (!robotBody.current) return;
        const time = state.clock.getElapsedTime();
        
        // 1. ANIMATE BODY ONLY (Bobbing)
        // We act on robotBody.current, NOT the group containing the Text
        robotBody.current.position.y = Math.sin(time * 2) * 0.2 + 2; 

        // 2. ANIMATE SCALE (Breathing/Talking)
        if (robotState === 'THINKING' || robotState === 'SPEAKING') {
            const scale = 1 + Math.sin(time * 15) * 0.1;
            robotBody.current.scale.set(scale, scale, scale);
        } else {
            robotBody.current.scale.set(1, 1, 1);
        }
    });

    // --- SEND MESSAGE (No changes here) ---
    const sendMessage = async (text) => {
        if (!text.trim()) return;
        setRobotState('THINKING');
        setRobotReply("Thinking...");
        try {

            const BACKEND_URL = 'http://localhost:3002';
            //const BACKEND_URL = 'https://x7gqb2sq-3002.inc1.devtunnels.ms';
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            setRobotState('SPEAKING');
            setRobotReply(data.reply);
            setUserText(""); 
            const utterance = new SpeechSynthesisUtterance(data.reply);
            utterance.onend = () => setRobotState('IDLE');
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            setRobotState('IDLE');
            setRobotReply("Error connecting to brain.");
        }
    };

    // --- KEYBOARD LISTENERS (No changes here) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 't' && !chatVisible) setChatVisible(true);
            if (e.key === 'Escape') {
                setChatVisible(false);
                setRobotState('IDLE');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chatVisible]);

    return (
        // MAIN CONTAINER (Static Position in Room)
        <group position={position} rotation={rotation}>
            
            {/* --- 1. CHAT UI (STATIC - DOES NOT MOVE) --- */}
            {chatVisible && (
                <Html position={[0, 4.5, 0]} center transform distanceFactor={10}>
                    <div 
                        style={{
                            background: 'rgba(20, 20, 30, 0.95)',
                            padding: '20px',
                            borderRadius: '15px',
                            border: `2px solid ${colors[robotState]}`,
                            width: '350px',
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            fontFamily: 'Arial, sans-serif',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                        }}
                        onKeyDown={(e) => e.stopPropagation()} 
                    >
                        <div style={{ 
                            minHeight: '60px', 
                            maxHeight: '150px',
                            overflowY: 'auto',
                            fontSize: '16px', 
                            lineHeight: '1.4',
                            borderBottom: '1px solid #444',
                            paddingBottom: '10px'
                        }}>
                            <span style={{color: colors[robotState], fontWeight: 'bold'}}>🤖 AI: </span> 
                            {robotReply}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text"
                                value={userText}
                                onChange={(e) => setUserText(e.target.value)}
                                placeholder="Ask an academic question..."
                                autoFocus
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                    background: '#333', color: 'white', outline: 'none'
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation(); 
                                    if (e.key === 'Enter') sendMessage(userText);
                                }}
                            />
                            <button 
                                onClick={() => sendMessage(userText)}
                                style={{
                                    background: '#00ccff', border: 'none', borderRadius: '8px',
                                    padding: '0 15px', cursor: 'pointer', fontWeight: 'bold', color: '#000'
                                }}
                            >
                                Ask
                            </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>
                            Press <b>Esc</b> to close
                        </div>
                    </div>
                </Html>
            )}

            {/* --- 2. ROBOT BODY (ANIMATED - BOBS UP & DOWN) --- */}
            <group ref={robotBody}>
                {/* Head */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 0.8, 0.8]} />
                    <meshStandardMaterial color="#444" roughness={0.2} metalness={0.8} />
                </mesh>
                
                {/* Eyes */}
                <mesh position={[-0.2, 0.1, 0.35]}>
                    <sphereGeometry args={[0.1]} />
                    <meshStandardMaterial color={colors[robotState]} emissive={colors[robotState]} emissiveIntensity={2} toneMapped={false}/>
                </mesh>
                <mesh position={[0.2, 0.1, 0.35]}>
                    <sphereGeometry args={[0.1]} />
                    <meshStandardMaterial color={colors[robotState]} emissive={colors[robotState]} emissiveIntensity={2} toneMapped={false}/>
                </mesh>

                {/* Floating Body */}
                <mesh position={[0, -0.8, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.4, 0.8, 4]} /> 
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>
        </group>
    );
};

export default RobotTutor;