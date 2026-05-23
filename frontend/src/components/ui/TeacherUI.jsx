import React from 'react';

const TeacherUI = ({ players, onShareScreen, onToggleMute, isMuted, onEndClass }) => {
  // Filter out the host (teacher) from the list
  const students = Object.values(players).filter(p => !p.isHost);

  // Helper to count distracted students
  const distractedCount = students.filter(p => p.attention === 'Distracted').length;

  return (
    <div 
      className="teacher-ui-overlay" 
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: 'calc(100% - 40px)', 
        zIndex: 100,
        pointerEvents: 'none', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        background: 'transparent'
      }}
    >

      {/* LEFT: CONTROLS */}
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: '10px' }}>
        <button 
            onClick={onShareScreen} 
            className="ui-button"
            style={{boxShadow: '0 4px 6px rgba(0,0,0,0.2)'}}
        >
            Share Screen
        </button>

        <button 
            onClick={onToggleMute} 
            className="ui-button"
            style={{ 
                backgroundColor: isMuted ? '#f44336' : '#4CAF50',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}
        >
            {isMuted ? 'Unmute Mic' : 'Mute Mic'}
        </button>

        {/* --- NEW: END CLASS BUTTON --- */}
        <button 
            onClick={onEndClass} 
            className="ui-button"
            style={{ 
                backgroundColor: '#d32f2f', // Dark Red
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                marginLeft: '20px'
            }}
        >
            End Class
        </button>
      </div>

      {/* RIGHT: CLASS MONITOR */}
      <div 
        className="player-list" 
        style={{
            position: 'absolute',
            bottom: '0', 
            right: '0',
            pointerEvents: 'auto',
            textAlign: 'right',
            fontFamily: 'sans-serif',
            background: 'transparent',
            textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ 
            marginBottom: '10px', 
            color: 'white', 
            fontSize: '18px', 
            fontWeight: 'bold'
        }}>
            Class Monitor:{" "}
            <span style={{color: distractedCount > 0 ? '#ff4444' : '#00cc00'}}>
                {distractedCount} Distracted
            </span>
        </div>

        <ul style={{margin: 0, padding: 0, listStyle: 'none'}}>
          {students.length === 0 && (
            <li style={{color: '#ddd'}}>Waiting for students...</li>
          )}
          
          {students.map(p => {
            const isDistracted = p.attention === 'Distracted';
            return (
                <li key={p.id} style={{
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center',
                    marginBottom: '5px',
                    color: 'white'
                }}>
                  <span style={{marginRight: '10px', fontWeight: 'bold'}}>
                      {p.userName} {p.handRaised ? '✋' : ''}
                  </span>

                  <div style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                  }}>
                      <span style={{fontSize: '11px', color: '#ccc', textTransform: 'uppercase'}}>
                          {p.mood}
                      </span>

                      <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: isDistracted ? '#ff4444' : '#00cc00',
                          boxShadow: isDistracted ? '0 0 8px #ff4444' : '0 0 5px #00cc00',
                          border: '1px solid rgba(255,255,255,0.5)'
                      }} />
                  </div>
                </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default TeacherUI;