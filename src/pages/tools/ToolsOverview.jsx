import { useNavigate } from 'react-router-dom';
import { useConversation } from '../../contexts/ConversationContext';
import { useToolPreferences } from '../../contexts/ToolPreferencesContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
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
          <h1>🔧 Clinical Tools Suite</h1>
          <p className="header-subtitle">
            Comprehensive medical decision support tools powered by AI and evidence-based guidelines
          </p>
          <div className="tools-workspace">
            <label htmlFor="workspaceSelect">Workspace</label>
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
              <span className="stat-label">Tools Available</span>
            </div>
            <div className="stat">
              <span className="stat-number">{categories.length}</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Availability</span>
            </div>
          </div>
        </div>
      </div>

      {recentToolItems.length > 0 && (
        <div className="tools-recent">
          <div className="tools-recent-header">
            <h2>🕓 Recent Tools</h2>
            <p>Pick up where you left off with your most used tools.</p>
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
                <span className="tools-recent-action">Open →</span>
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
                  title={favorites.includes(tool.id) ? 'Remove from favorites' : 'Add to favorites'}
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
                  title={pinned.includes(tool.id) ? 'Unpin tool' : 'Pin tool'}
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
              <h4>Key Features:</h4>
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
              <h4>Use Cases:</h4>
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
                Open Tool →
              </button>
              <button
                className="btn-chat-tool"
                onClick={(e) => {
                  e.stopPropagation();
                  recordToolAccess(tool.id);
                  navigate('/dashboard', { state: { toolMention: `/${tool.id}` } });
                }}
              >
                Use in Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips Section */}
      <div className="tools-tips">
        <h2>💡 Quick Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">⌨️</span>
            <h3>Keyboard Shortcuts</h3>
            <p>Use Ctrl+1 through Ctrl+6 to quickly access tools from anywhere</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">💬</span>
            <h3>Chat Integration</h3>
            <p>Type /tool-name in chat to invoke tools directly in conversation</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">💾</span>
            <h3>State Persistence</h3>
            <p>Tool inputs are saved per conversation for easy reference</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🤖</span>
            <h3>AI Awareness</h3>
            <p>CareDroid can read and reference tool data in responses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsOverview;
