import React from 'react';

export default function TestApp() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b1220, #1a2a4e)',
      color: '#fff',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{ maxWidth: '600px', textAlign: 'center', padding: '40px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', background: 'linear-gradient(135deg, #00ff88, #00ffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          CareDroid AI
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '40px', color: 'rgba(255,255,255,0.8)' }}>
          Clinical AI Assistant Platform
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(0,255,136,0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px'
        }}>
          <p style={{ marginBottom: '10px' }}>✓ React is loaded</p>
          <p style={{ marginBottom: '10px' }}>✓ Vite dev server is running</p>
          <p>✓ Test app is rendering</p>
        </div>

        <button onClick={() => window.location.reload()} style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: 'linear-gradient(135deg, #00ff88, #00ffff)',
          color: '#0b1220',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
          Reload App
        </button>
      </div>
    </div>
  );
}
