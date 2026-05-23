import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  console.log('LandingPage mounted');
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const handleJoin = (asHost) => {
    const trimmedUserName = userName.trim();
    const trimmedRoomName = roomName.trim();

    if (!trimmedUserName || !trimmedRoomName) {
      alert('Please enter both your name and a room name.');
      return;
    }

    navigate(`/room/${trimmedRoomName}`, {
      state: {
        userName: trimmedUserName,
        asHost
      }
    });
  };

  return (
    <div className="landing-container">
      <form onSubmit={(e) => e.preventDefault()} className="landing-form">
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="landing-input"
        />
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="landing-input"
        />
        <div className="button-group">
          <button
            onClick={() => handleJoin(true)}
            className="landing-button teacher"
          >
            Create Room (as Teacher)
          </button>
          <button
            onClick={() => handleJoin(false)}
            className="landing-button student"
          >
            Join Room (as Student)
          </button>
        </div>
      </form>
    </div>
  );
};

export default LandingPage;