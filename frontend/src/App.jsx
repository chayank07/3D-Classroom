import { useState } from 'react';
import { KeyboardControls } from '@react-three/drei';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// --- FIXED IMPORTS (Use relative paths) ---
// Ensure these files exist in your src/pages folder
import LoginPage from './pages/LoginPage';
import JoinPage from './pages/JoinPage';
import AvatarSelectionPage from './pages/AvatarSelectionPage';
import Classroom from './components/scene/Classroom';

const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'hand', keys: ['KeyH'] },
];

function App() {
    return (
        <KeyboardControls map={keyboardMap}>
            <BrowserRouter>
                <Routes>
                    {/* 1. Login (Select Role) */}
                    <Route path="/" element={<LoginPage />} />
                    
                    {/* 2. Join (Enter Name/Room) */}
                    <Route path="/join" element={<JoinPage />} />
                    
                    {/* 3. Avatar Selection */}
                    <Route path="/avatar-selection" element={<AvatarSelectionPage />} />
                    
                    {/* 4. Classroom */}
                    <Route path="/room/:roomName" element={<Classroom />} />
                </Routes>
            </BrowserRouter>
        </KeyboardControls>
    );
}

export default App;