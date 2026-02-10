import { useNavigate } from 'react-router-dom';
import { useConversation } from '../../contexts/ConversationContext';
import { useToolPreferences } from '../../contexts/ToolPreferencesContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useLanguage } from '../../contexts/LanguageContext';
import toolRegistry, { toolRegistryById } from '../../data/toolRegistry';
import './ToolsOverview.css';

const ToolsOverview = () => {
  const navigate = useNavigate();
  const { selectTool } = useConversation();
  const {
    favorites,
    pinned,
    recentTools,
    toggleFavorite,
    togglePinned,
    recordToolAccess
  } = useToolPreferences();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const { t } = useLanguage();

  const tools = toolRegistry;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const workspaceToolIds = activeWorkspace?.toolIds?.length
    ? activeWorkspace.toolIds
    : tools.map((tool) => tool.id);
  const filteredTools = tools.filter((tool) => workspaceToolIds.includes(tool.id));
  const recentToolItems = recentTools
    .map((toolId) => toolRegistryById[toolId])
    .filter((tool) => tool && workspaceToolIds.includes(tool.id));

  const handleToolClick = (tool) => {
    recordToolAccess(tool.id);
    selectTool(tool.id);
    navigate(tool.path);
  };

  const categories = [...new Set(filteredTools.map(t => t.category))];
  const orderedTools = [
    ...filteredTools.filter((tool) => pinned.includes(tool.id)),
    ...filteredTools.filter((tool) => !pinned.includes(tool.id))
  ];

  return (
    <div className="tools-overview">
      <div className="tools-overview-header">
        <div className="header-content">
          <h1>🔧 {t('tools.overview.title')}</h1>
          <p className="header-subtitle">
            {t('tools.overview.subtitle')}
          </p>
          <div className="tools-workspace">
            <label htmlFor="workspaceSelect">{t('tools.overview.workspace')}</label>
            <select
              id="workspaceSelect"
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-number">{tools.length}</span>
              <span className="stat-label">{t('tools.overview.toolsAvailable')}</span>
            </div>
            <div className="stat">
              <span className="stat-number">{categories.length}</span>
              <span className="stat-label">{t('tools.overview.categories')}</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">{t('tools.overview.availability')}</span>
            </div>
          </div>
        </div>
      </div>

      {recentToolItems.length > 0 && (
        <div className="tools-recent">
          <div className="tools-recent-header">
            <h2>🕓 {t('tools.overview.recentTools')}</h2>
            <p>{t('tools.overview.recentToolsDescription')}</p>
          </div>
          <div className="tools-recent-list">
            {recentToolItems.map((tool) => (
              <button
                key={tool.id}
                className="tools-recent-card"
                onClick={() => handleToolClick(tool)}
                type="button"
              >
                <span className="tools-recent-icon">{tool.icon}</span>
                <div className="tools-recent-info">
                  <span className="tools-recent-name">{tool.name}</span>
                  <span className="tools-recent-category">{tool.category}</span>
                </div>
                <span className="tools-recent-action">{t('tools.overview.open')} →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tools-grid">
        {orderedTools.map(tool => (
          <div
            key={tool.id}
            className="tool-card-large"
            onClick={() => handleToolClick(tool)}
            style={{ borderColor: tool.color }}
          >
            <div className="tool-card-header">
              <div className="tool-icon" style={{ backgroundColor: `${tool.color}20` }}>
                <span>{tool.icon}</span>
              </div>
              <div className="tool-meta">
                <h3>{tool.name}</h3>
                <span className="tool-category" style={{ backgroundColor: `${tool.color}20`, color: tool.color }}>
                  {tool.category}
                </span>
              </div>
              <div className="tool-card-actions">
                <button
                  className={`tool-card-action ${favorites.includes(tool.id) ? 'active' : ''}`}
                  title={favorites.includes(tool.id) ? t('tools.removeFromFavorites') : t('tools.addToFavorites')}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(tool.id);
                  }}
                  type="button"
                >
                  ★
                </button>
                <button
                  className={`tool-card-action ${pinned.includes(tool.id) ? 'active' : ''}`}
                  title={pinned.includes(tool.id) ? t('tools.unpinTool') : t('tools.pinTool')}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinned(tool.id);
                  }}
                  type="button"
                >
                  📌
                </button>
                <div className="tool-shortcut">
                  {tool.shortcut.replace('Ctrl+', '⌘')}
                </div>
              </div>
            </div>

            <p className="tool-description">{tool.description}</p>

            <div className="tool-features">
              <h4>{t('tools.overview.keyFeatures')}:</h4>
              <ul>
                {tool.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="feature-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="tool-use-cases">
              <h4>{t('tools.overview.useCases')}:</h4>
              <div className="use-cases-tags">
                {tool.useCases.map((useCase, idx) => (
                  <span key={idx} className="use-case-tag">
                    {useCase}
                  </span>
                ))}
              </div>
            </div>

            <div className="tool-actions">
              <button
                className="btn-open-tool"
                style={{ backgroundColor: tool.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick(tool);
                }}
              >
                {t('tools.overview.openTool')} →
              </button>
              <button
                className="btn-chat-tool"
                onClick={(e) => {
                  e.stopPropagation();
                  recordToolAccess(tool.id);
                  navigate('/dashboard', { state: { toolMention: `/${tool.id}` } });
                }}
              >
                {t('tools.overview.useInChat')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips Section */}
      <div className="tools-tips">
        <h2>💡 {t('tools.overview.quickTips')}</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">⌨️</span>
            <h3>{t('tools.overview.keyboardShortcuts')}</h3>
            <p>{t('tools.overview.keyboardShortcutsDescription')}</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">💬</span>
            <h3>{t('tools.overview.chatIntegration')}</h3>
            <p>{t('tools.overview.chatIntegrationDescription')}</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">💾</span>
            <h3>{t('tools.overview.statePersistence')}</h3>
            <p>{t('tools.overview.statePersistenceDescription')}</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🤖</span>
            <h3>{t('tools.overview.aiAwareness')}</h3>
            <p>{t('tools.overview.aiAwarenessDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsOverview;
