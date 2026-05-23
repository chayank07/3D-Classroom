import React from 'react';
import EmotionDetector from '../EmotionDetector';

const StudentUI = ({ onRaiseHand, handRaised, socket, onToggleMute, isMuted }) => {
  return (
    <div className="student-ui-overlay">
      
      {/* Emotion Detector (Hidden, as you requested) */}
      {socket && (
          <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 100,
              display: 'none' 
          }}>
              <EmotionDetector socket={socket} />
          </div>
      )}

      {/* --- FIX: Better Raise Hand Button --- */}
      <button 
        onClick={onRaiseHand} 
        className="ui-button"
        style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 100,
            // Conditional style:
            backgroundColor: handRaised ? '#007bff' : '#f8f9fa',
            color: handRaised ? 'white' : 'black',
            border: handRaised ? '1px solid #007bff' : '1px solid #ccc'
        }}
      >
        {handRaised ? '✋ Hand Down' : '✋ Raise Hand'}
      </button>

      {/* Mute/Unmute Button (no change) */}
      <button 
        onClick={onToggleMute} 
        className="ui-button"
        style={{
            position: 'absolute',
            bottom: '20px',
            left: '160px', 
            zIndex: 100,
            backgroundColor: isMuted ? '#f44336' : '#4CAF50'
        }}
      >
        {isMuted ? 'Unmute Mic' : 'Mute Mic'}
      </button>

    </div>
  );
};

export default StudentUI;