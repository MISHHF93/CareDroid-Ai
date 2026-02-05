import React from 'react';

// Minimal App - just to test React is working
function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b1220',
      color: '#00ff88',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '48px', margin: 0 }}>✅ React is Working!</h1>
      <p style={{ fontSize: '18px', color: '#94a3b8' }}>
        CareDroid app successfully mounted
      </p>
      <button
        onClick={() => alert('Button works!')}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#00ff88',
          color: '#0b1220',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default App;
