import React from 'react';
import AppShell from '../layout/AppShell';

/**
 * Simplified route wrapper that reduces AppShell prop duplication
 * All authenticated routes use this to avoid repeating props
 */
const AppRoute = ({ 
  children,
  isAuthed,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onSignOut,
  authToken,
  healthStatus,
  currentTool,
  currentFeature,
  onToolSelect,
  onFeatureSelect
}) => (
  <AppShell
    isAuthed={isAuthed}
    conversations={conversations}
    activeConversation={activeConversation}
    onSelectConversation={onSelectConversation}
    onNewConversation={onNewConversation}
    onSignOut={onSignOut}
    authToken={authToken}
    healthStatus={healthStatus}
    currentTool={currentTool}
    currentFeature={currentFeature}
    onToolSelect={onToolSelect}
    onFeatureSelect={onFeatureSelect}
  >
    {children}
  </AppShell>
);

export default AppRoute;
