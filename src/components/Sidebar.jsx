import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  conversations, 
  activeConversation, 
  onSelectConversation,
  onNewConversation,
  isMobile,
  authToken,
  onSignOut
}) => {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}
      
      {/* Sidebar container */}
      <div style={{
        width: '280px',
        height: '100vh',
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 1000,
        left: 0,
        top: 0,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : (isOpen ? 'translateX(0)' : 'translateX(-280px)'),
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.15)' : 'none'
      }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          background: 'var(--gradient-accent)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🤖 CareDroid
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted-text)',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>

      {/* New Conversation Button */}
      <div style={{ padding: 'var(--space-md)' }}>
        <button
          onClick={onNewConversation}
          style={{
            width: '100%',
            background: 'var(--gradient-accent)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            color: 'var(--navy-ink)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-xs)'
          }}
        >
          ➕ New Conversation
        </button>
      </div>

      {/* Conversations */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 var(--space-md)'
      }}>
        {/* Recent Conversations */}
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          margin: 'var(--space-lg) 0 var(--space-sm)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Recent Conversations
        </div>
        {conversations.slice(-5).reverse().map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            style={{
              width: '100%',
              background: activeConversation === conv.id 
                ? 'var(--surface-hover)' 
                : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              marginBottom: 'var(--space-2xs)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 'var(--text-sm)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeConversation !== conv.id) {
                e.currentTarget.style.background = 'var(--surface-hover-subtle)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeConversation !== conv.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <div style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              💬 {conv.title}
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            No conversations yet.
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'grid', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
          <Link to="/profile" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: 'var(--text-xs)' }}>Profile</Link>
          <Link to="/profile-settings" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: 'var(--text-xs)' }}>Profile Settings</Link>
          <Link to="/settings" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: 'var(--text-xs)' }}>App Settings</Link>
          {!authToken && (
            <Link to="/auth" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: 'var(--text-xs)' }}>Log in</Link>
          )}
          {authToken && (
            <button
              onClick={onSignOut}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                fontSize: 'var(--text-xs)'
              }}
            >
              Log out
            </button>
          )}
        </div>
        <div style={{ marginBottom: '8px' }}>
          🔒 HIPAA Compliant
        </div>
        <div>
          v1.0.0 • Clinical AI Assistant
        </div>
      </div>
      </div>
    </>
  );
};

export default Sidebar;