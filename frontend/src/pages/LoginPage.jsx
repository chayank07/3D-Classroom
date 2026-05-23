import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      navigate('/join');
    }
  }, [navigate]);

  const handleLogin = (role) => {
    localStorage.setItem('userRole', role);
    navigate('/join');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Meta-Classroom</h1>
        <p style={styles.subtitle}>Select your role to continue</p>
        
        <div style={styles.buttonGroup}>
          <button 
            style={{...styles.button, backgroundColor: '#4CAF50'}}
            onClick={() => handleLogin('teacher')}
          >
            👨‍🏫 I am a Teacher
          </button>
          
          <button 
            style={{...styles.button, backgroundColor: '#2196F3'}}
            onClick={() => handleLogin('student')}
          >
            👨‍🎓 I am a Student
          </button>
        </div>
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
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    textAlign: 'center',
    width: '350px',
  },
  title: { margin: '0 0 10px 0', color: '#333' },
  subtitle: { margin: '0 0 30px 0', color: '#666' },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: '15px' },
  button: {
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    fontWeight: 'bold',
  },
};

export default LoginPage;