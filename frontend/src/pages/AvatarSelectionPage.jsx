import React, { useState, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// --- FIX: Correct path to Avatar ---
// Go up to 'src' (..), then into 'components', then 'scene', then 'Avatar'
import Avatar from '../components/scene/Avatar'; 

const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#34495E', '#E67E22', '#1ABC9C'];

const AvatarSelectionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userName, roomName, role } = location.state || {};
    
    // Default color if none selected
    const [selectedColor, setSelectedColor] = useState(colors[0]);

    // Safety check: if they navigated here manually without data
    if (!userName || !roomName) {
        return (
            <div style={{padding: 50, fontFamily: 'sans-serif'}}>
                <h2>⚠️ Error: Missing Session Data</h2>
                <p>Please go back to the login page.</p>
                <button onClick={() => navigate('/')} style={styles.button}>Go to Login</button>
            </div>
        );
    }

    const handleEnterClassroom = () => {
        // Navigate to the REAL classroom with all data
        navigate(`/room/${roomName}`, { 
            state: { 
                userName: userName, 
                asHost: role === 'teacher',
                avatarColor: selectedColor // Pass the chosen color!
            } 
        });
    };

    return (
        <div style={styles.container}>
            {/* Left Side: Controls */}
            <div style={styles.controlsPanel}>
                <h1 style={styles.title}>Customize Your Look</h1>
                <p>Hello, <strong>{userName}</strong>!</p>
                <p style={{fontSize: '14px', color: '#666'}}>Select a color for your avatar:</p>
                
                <div style={styles.colorGrid}>
                    {colors.map(color => (
                        <div 
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            style={{
                                ...styles.colorCircle,
                                backgroundColor: color,
                                border: selectedColor === color ? '3px solid #333' : '3px solid transparent',
                                transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                                boxShadow: selectedColor === color ? '0 4px 10px rgba(0,0,0,0.2)' : 'none'
                            }}
                        />
                    ))}
                </div>

                <div style={{marginTop: 'auto'}}>
                    <p style={{fontSize: '12px', color: '#888', marginBottom: '10px'}}>
                        Role: <strong>{role ? role.toUpperCase() : 'STUDENT'}</strong>
                    </p>
                    <button onClick={handleEnterClassroom} style={styles.button}>
                        Enter Classroom 🚀
                    </button>
                </div>
            </div>

            {/* Right Side: 3D Preview */}
            <div style={styles.canvasContainer}>
                <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
                    <ambientLight intensity={0.7} />
                    <pointLight position={[10, 10, 10]} />
                    <Suspense fallback={null}>
                        {/* We reuse your Avatar component! 
                            We pass socket={null} so it doesn't try to connect.
                        */}
                        <Avatar 
                            id="preview"
                            socket={null} 
                            position={{x: 0, y: -0.8, z: 0}} // Lower it slightly to stand on floor
                            rotation={{x: 0, y: 0, z: 0}}
                            color={selectedColor} // Pass the color to preview
                            mood="happy" // Make them smile in the preview!
                        />
                        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                        
                        {/* Simple Floor for preview */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
                            <circleGeometry args={[2, 32]} />
                            <meshStandardMaterial color="#e0e0e0" />
                        </mesh>
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        overflow: 'hidden'
    },
    controlsPanel: {
        width: '400px',
        padding: '50px',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        zIndex: 10,
        boxShadow: '4px 0 20px rgba(0,0,0,0.05)'
    },
    canvasContainer: {
        flex: 1,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    },
    title: { marginBottom: '10px', color: '#2c3e50', fontSize: '32px' },
    colorGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        margin: '30px 0'
    },
    colorCircle: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    button: {
        width: '100%',
        padding: '18px',
        border: 'none',
        borderRadius: '12px',
        backgroundColor: '#1e3c72',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'transform 0.1s, background-color 0.2s',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }
};

export default AvatarSelectionPage;