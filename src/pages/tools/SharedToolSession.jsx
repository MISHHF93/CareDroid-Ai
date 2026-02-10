import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSharedSession } from '../../utils/sharedSessions';
import toolRegistry, { toolRegistryById } from '../../data/toolRegistry';
import { useLanguage } from '../../contexts/LanguageContext';
import './SharedToolSession.css';

const SharedToolSession = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const session = getSharedSession(shareId);
  const tool = session?.toolId ? toolRegistryById[session.toolId] : null;

  if (!session) {
    return (
      <div className="shared-session">
        <div className="shared-session-card">
          <h1>{t('tools.shared.sessionNotFound')}</h1>
          <p>{t('tools.shared.invalidOrExpired')}</p>
          <button onClick={() => navigate('/tools')}>{t('tools.shared.browseTools')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-session">
      <div className="shared-session-card">
        <span className="shared-tag">{t('tools.shared.sharedSession')}</span>
        <h1>{tool?.icon || '🧰'} {session.toolName || t('tools.shared.clinicalTool')}</h1>
        <p>{session.toolDescription || t('tools.shared.defaultDescription')}</p>
        <div className="shared-meta">
          <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
          <span>Tool: {session.toolId}</span>
        </div>
        <div className="shared-actions">
          <button onClick={() => navigate('/dashboard')}>{t('tools.shared.openDashboard')}</button>
          {tool && (
            <button onClick={() => navigate(tool.path)}>{t('tools.shared.openTool')}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedToolSession;
