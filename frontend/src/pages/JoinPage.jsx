import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (!savedRole) {
      navigate('/'); // Go back to login if no role found
    } else {
      setRole(savedRole);
    }
  }, [navigate]);

  const handleNext = (e) => {
    e.preventDefault();
    if (!name || !room) return alert("Please fill in all fields");
    
    // Navigate to Avatar Selection, passing the data
    navigate('/avatar-selection', { 
        state: { userName: name, roomName: room, role: role } 
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
            <h2 style={styles.title}>Join Room</h2>
            <span style={styles.badge}>{role.toUpperCase()}</span>
        </div>
        
        <form onSubmit={handleNext} style={styles.form}>
            <div style={styles.inputGroup}>
                <label>Your Name</label>
                <input 
                    type="text" 
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                />
            </div>

            <div style={styles.inputGroup}>
                <label>Room Name</label>
                <input 
                    type="text" 
                    placeholder="e.g. ScienceClass"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    style={styles.input}
                />
            </div>

            <button type="submit" style={styles.button}>Next: Customize Avatar ➜</button>
        </form>

        <button onClick={handleLogout} style={styles.linkButton}>Not you? Logout</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0f2f5',
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '400px',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { margin: 0, color: '#333' },
  badge: { 
      background: '#eee', padding: '5px 10px', borderRadius: '4px', 
      fontSize: '12px', fontWeight: 'bold', color: '#555' 
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: {
      padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px'
  },
  button: {
      padding: '15px', border: 'none', borderRadius: '8px',
      backgroundColor: '#1e3c72', color: 'white', fontSize: '16px',
      cursor: 'pointer', fontWeight: 'bold', marginTop: '10px'
  },
  linkButton: {
      background: 'none', border: 'none', color: '#666', 
      marginTop: '20px', cursor: 'pointer', textDecoration: 'underline', width: '100%'
  }
};

export default JoinPage;