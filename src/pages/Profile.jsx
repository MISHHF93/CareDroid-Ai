import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';

const Profile = () => {
  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <Card style={{ width: '100%', maxWidth: '640px' }}>
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '14px' }}>
          Your profile details will appear here once authentication is connected.
        </p>
        <div style={{
          marginTop: '18px',
          display: 'grid',
          gap: '12px',
          fontSize: '14px'
        }}>
          <div className="card-subtle" style={{ padding: '12px 16px' }}><strong>Name:</strong> —</div>
          <div className="card-subtle" style={{ padding: '12px 16px' }}><strong>Email:</strong> —</div>
          <div className="card-subtle" style={{ padding: '12px 16px' }}><strong>Role:</strong> —</div>
          <div className="card-subtle" style={{ padding: '12px 16px' }}><strong>Institution:</strong> —</div>
        </div>
        <div style={{ marginTop: '18px', fontSize: '12px', color: 'var(--muted-text)' }}>
          <Link to="/" style={{ color: '#00FF88', textDecoration: 'none' }}>
            ← Back to chat
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
