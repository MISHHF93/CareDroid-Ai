import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useConversation } from '../contexts/ConversationContext';
import { useToolPreferences } from '../contexts/ToolPreferencesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotificationActions } from '../hooks/useNotificationActions';
import AppShell from '../layout/AppShell';
import toolRegistry from '../data/toolRegistry';
import ToolVisualization from '../components/ToolVisualization';
import { apiFetch } from '../services/apiClient';
import analyticsService from '../services/analyticsService';
import { getToolRecommendationsNLU, recordRecommendationFeedback } from '../utils/toolRecommendations';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import HolographicLoader from '../components/3d/HolographicLoader';

// Lazy-load heavy 3D components for code splitting
const HolographicCanvas = lazy(() => import('../components/3d/HolographicCanvas'));
const HeartModel = lazy(() => import('../components/3d/medical/HeartModel'));
const BrainModel = lazy(() => import('../components/3d/medical/BrainModel'));
const LungsModel = lazy(() => import('../components/3d/medical/LungsModel'));

/** Keywords that trigger anatomy 3D panel */
const ANATOMY_KEYWORDS = {
  heart: ['heart', 'cardiac', 'myocardial', 'coronary', 'arrhythmia'],
  brain: ['brain', 'neuro', 'stroke', 'seizure', 'cerebral', 'cranial'],
  lungs: ['lung', 'pulmonary', 'respiratory', 'pneumonia', 'breathing', 'copd'],
};

function detectAnatomyKeyword(text) {
  const lower = text.toLowerCase();
  for (const [organ, keywords] of Object.entries(ANATOMY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return organ;
  }
  return null;
}

function AnatomyViewer({ organ }) {
  const ModelComponent = { heart: HeartModel, brain: BrainModel, lungs: LungsModel }[organ];
  if (!ModelComponent) return null;
  return (
    <div style={{ width: '100%', height: 220, borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
      <Suspense fallback={<HolographicLoader size={40} label="" />}>
        <HolographicCanvas cameraPosition={[0, 0, 3]} controls>
          <Suspense fallback={null}>
            <ModelComponent interactive rotateOnHover showLabel />
          </Suspense>
        </HolographicCanvas>
      </Suspense>
    </div>
  );
}

/**
 * Chat Page - AI Conversation Interface
 * Clinical AI chat with tool recommendations and conversation management
 */
function Chat() {
  const { signOut } = useUser();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { error } = useNotificationActions();
  const { recordToolAccess } = useToolPreferences();
  const {
    conversations,
    activeConversationId,
    messages,
    selectedTool,
    isLoading,
    addConversation,
    selectConversation,
    addMessage,
    selectTool,
    setIsLoading
  } = useConversation();
  const [input, setInput] = useState('');
  const [recommendedTools, setRecommendedTools] = useState([]);
  const [show3D, setShow3D] = useState(true);
  const { supported: webglSupported } = useWebGLSupport();

  const clinicalTools = toolRegistry;

  const shouldUse3DEndpoint = (prompt) => {
    const lower = prompt.toLowerCase();

    const keywordDriven3D = /(heart|brain|lung|liver|kidney|anatomy|organ|drug|interaction|medication|contraindication|history|timeline|progression|course|lab|cbc|creatinine|lactate|trend|sofa|calculator)/i.test(lower);

    const selectedToolSupports3D = ['drug-check', 'lab-interp', 'calculators'].includes(selectedTool);

    const recommendationSupports3D = recommendedTools.some((tool) => {
      if (['drug-check', 'lab-interp', 'calculators'].includes(tool.id)) return true;
      return /(anatomy|organ|drug|interaction|lab|timeline|trend|sofa|3d|holograph)/i.test(
        `${tool.recommendationReason || ''} ${tool.name || ''}`
      );
    });

    return keywordDriven3D || selectedToolSupports3D || recommendationSupports3D;
  };

  const buildVisualizationsFromPrompt = (prompt) => {
    const lower = prompt.toLowerCase();
    const visualizations = [];

    if (/(heart|brain|lung|liver|kidney|anatomy|organ)/.test(lower)) {
      const organ = lower.includes('heart')
        ? 'heart'
        : lower.includes('brain')
          ? 'brain'
          : lower.includes('lung')
            ? 'lungs'
            : lower.includes('liver')
              ? 'liver'
              : lower.includes('kidney')
                ? 'kidney'
                : 'general';
      visualizations.push({
        type: 'anatomy-3d',
        data: {
          organ,
          vitals: { HR: 88, SpO2: '97%', RR: 18 },
          markers: [{ id: 'critical-zone', severity: 'moderate', position: [0.25, 0.55, 0.3] }],
        },
        metadata: {
          camera: { position: [0, 1.35, 5], fov: 50 },
          animation: ['rotate', 'pulse'],
        },
      });
    }

    if (/(drug|interaction|medication|contraindication)/.test(lower)) {
      visualizations.push({
        type: 'drug-network-3d',
        data: {
          nodes: [
            { id: 'warfarin', label: 'Warfarin', severity: 'major', position: [-1.1, 0.3, 0] },
            { id: 'aspirin', label: 'Aspirin', severity: 'moderate', position: [0.95, 0.2, 0] },
            { id: 'amiodarone', label: 'Amiodarone', severity: 'major', position: [0, -0.85, 0.2] },
          ],
          links: [
            { source: 'warfarin', target: 'aspirin', weight: 0.95 },
            { source: 'warfarin', target: 'amiodarone', weight: 0.8 },
          ],
        },
      });
    }

    if (/(lab|cbc|creatinine|lactate|trend)/.test(lower)) {
      visualizations.push({
        type: 'lab-chart-3d',
        data: {
          items: [
            { label: 'WBC', value: 11.2, max: 20 },
            { label: 'Cr', value: 1.8, max: 4 },
            { label: 'Lactate', value: 2.9, max: 6 },
            { label: 'CRP', value: 72, max: 120 },
          ],
        },
      });
    }

    if (/(history|timeline|progression|course)/.test(lower)) {
      visualizations.push({
        type: 'timeline-3d',
        data: {
          events: [
            { id: 'h1', title: 'Symptom onset', status: 'resulted', critical: false },
            { id: 'h2', title: 'Sepsis alert', status: 'resulted', critical: true },
            { id: 'h3', title: 'Antibiotics administered', status: 'resulted', critical: false },
          ],
        },
      });
    }

    return visualizations;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userPrompt = input.trim();

    // Add user message
    addMessage(userPrompt, 'user');
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('caredroid_access_token');
      const supports3D = shouldUse3DEndpoint(userPrompt);

      const sharedHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let response;

      if (supports3D) {
        analyticsService.trackEvent({
          eventName: 'chat_3d_route_attempted',
          parameters: {
            conversationId: activeConversationId,
            selectedTool,
          },
        });

        const payload3D = {
          patientId: String(activeConversationId || 'chat-session'),
          message: userPrompt,
          context: {
            medications: selectedTool === 'drug-check' ? ['Current medication list'] : [],
            activeProblems: [],
          },
        };

        response = await apiFetch('/api/chat/message-3d', {
          method: 'POST',
          headers: sharedHeaders,
          body: JSON.stringify(payload3D),
        });

        if (!response.ok) {
          analyticsService.trackEvent({
            eventName: 'chat_3d_route_fallback',
            parameters: {
              conversationId: activeConversationId,
              statusCode: response.status,
              selectedTool,
            },
          });

          response = await apiFetch('/api/chat/message', {
            method: 'POST',
            headers: sharedHeaders,
            body: JSON.stringify({
              message: userPrompt,
              tool: selectedTool || undefined,
            }),
          });
        } else {
          analyticsService.trackEvent({
            eventName: 'chat_3d_route_succeeded',
            parameters: {
              conversationId: activeConversationId,
              selectedTool,
            },
          });
        }
      } else {
        analyticsService.trackEvent({
          eventName: 'chat_standard_route_used',
          parameters: {
            conversationId: activeConversationId,
            selectedTool,
          },
        });

        response = await apiFetch('/api/chat/message', {
          method: 'POST',
          headers: sharedHeaders,
          body: JSON.stringify({
            message: userPrompt,
            tool: selectedTool || undefined,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Chat request failed (${response.status})`);
      }

      const data = await response.json();
      const backendVisualizations = Array.isArray(data?.visualizations) ? data.visualizations : [];

      addMessage(data?.response || t('chat.failedToSendMessage'), 'assistant', {
        visualizations: backendVisualizations.length > 0
          ? backendVisualizations
          : buildVisualizationsFromPrompt(userPrompt),
      });
    } catch (err) {
      analyticsService.trackEvent({
        eventName: 'chat_route_failed',
        parameters: {
          conversationId: activeConversationId,
          selectedTool,
          errorName: err?.name || 'Error',
        },
      });

      const selectedToolName = clinicalTools.find((tool) => tool.id === selectedTool)?.name;
      const fallbackText = `I'm analyzing your request about "${userPrompt}".${selectedToolName ? ` Using ${selectedToolName}...` : ''}`;

      addMessage(fallbackText, 'assistant', {
        visualizations: buildVisualizationsFromPrompt(userPrompt),
      });
      error(t('chat.messageFailed'), t('chat.failedToSendMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    addConversation();
  };

  const handleSelectConversation = (conversationId) => {
    selectConversation(conversationId);
  };

  const handleSelectTool = (toolId) => {
    recordToolAccess(toolId);
    selectTool(toolId);
  };

  const recommendationSource = useMemo(() => {
    if (input.trim()) {
      return input.trim();
    }

    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
    return lastUserMessage?.content || '';
  }, [input, messages]);

  // Get NLU-based recommendations (async)
  useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      if (!recommendationSource) {
        setRecommendedTools([]);
        return;
      }

      try {
        const context = {
          userId: activeConversationId,
          userPreferences: recordToolAccess ? { favoritedTools: [] } : undefined,
          recentTools: [] // Could track recently used tools
        };

        const tools = await getToolRecommendationsNLU(recommendationSource, context, 3);
        
        if (!cancelled) {
          setRecommendedTools(tools);
        }
      } catch (error) {
        console.error('Failed to get recommendations:', error);
        if (!cancelled) {
          setRecommendedTools([]);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [recommendationSource, activeConversationId]);

  useEffect(() => {
    if (recommendedTools.length > 0) {
      analyticsService.trackEvent({
        eventName: 'tool_recommendations_shown',
        parameters: {
          count: recommendedTools.length,
          source: recommendationSource.slice(0, 120),
        },
      });
    }
  }, [recommendedTools, recommendationSource]);

  const handleSignOut = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <AppShell
      isAuthed={true}
      conversations={conversations}
      activeConversation={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onSignOut={handleSignOut}
      healthStatus="online"
      currentTool={selectedTool}
      onToolSelect={handleSelectTool}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        minWidth: 0,
        height: '100%'
      }}>
        {/* Main Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          {/* 3D Toggle Button */}
          {webglSupported && (
            <div style={{ padding: '8px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShow3D((v) => !v)}
                aria-pressed={show3D}
                aria-label={show3D ? 'Switch to 2D view' : 'Switch to 3D view'}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,229,255,0.4)',
                  background: show3D ? 'rgba(0,229,255,0.15)' : 'transparent',
                  color: '#00e5ff',
                  fontSize: 12,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {show3D ? '3D On' : '3D Off'}
              </button>
            </div>
          )}
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(12px, 4dvw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '24px',
                color: 'var(--muted-text)'
              }}>
                <div style={{ fontSize: '48px' }}>🏥</div>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>
                    {t('chat.welcomeTitle')}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {t('chat.welcomeDescription')}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '12px', color: 'var(--accent-green)' }}>
                    {t('chat.selectToolHint')}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '12px'
                  }}
                >
                  {msg.role === 'assistant' && <div style={{ fontSize: '20px' }}>🤖</div>}
                  <div
                    style={{
                      maxWidth: 'min(92dvw, 760px)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'var(--surface-1)',
                      color: msg.role === 'user' ? 'var(--navy-ink)' : 'var(--text-color)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--panel-border)',
                      lineHeight: 1.5
                    }}
                  >
                    {msg.content}
                    {/* 3D Anatomy Viewer — shown for assistant messages with anatomy keywords */}
                    {msg.role === 'assistant' && webglSupported && show3D && (
                      (() => {
                        const organ = detectAnatomyKeyword(msg.content || '');
                        return organ ? <AnatomyViewer organ={organ} /> : null;
                      })()
                    )}
                    {Array.isArray(msg.visualizations) && msg.visualizations.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {msg.visualizations.map((viz, idx) => (
                          <ToolVisualization key={`${viz.type || 'viz'}-${idx}`} visualization={viz} />
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && <div style={{ fontSize: '20px' }}>👤</div>}
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-text)' }}>
                <div style={{ fontSize: '20px' }}>🤖</div>
                <div style={{ animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.7 }}>
                  {t('chat.thinking')}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: 'clamp(12px, 4dvw, 20px)',
            borderTop: '1px solid var(--panel-border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'relative'
          }}>
            {recommendedTools.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '84px',
                left: '0',
                right: '0',
                background: 'var(--surface-2)',
                border: '1px solid var(--panel-border)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: 'var(--shadow-1)'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--muted-text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {t('chat.suggestedTools')}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recommendedTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        analyticsService.trackEvent({
                          eventName: 'tool_recommendation_clicked',
                          parameters: { 
                            toolId: tool.id,
                            confidence: tool.confidence,
                            reason: tool.recommendationReason
                          },
                        });
                        recordRecommendationFeedback(tool.id, true);
                        handleSelectTool(tool.id);
                        navigate(tool.path);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '999px',
                        border: `1px solid ${tool.color}55`,
                        background: `${tool.color}20`,
                        color: 'var(--text-color)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{tool.icon}</span>
                      <span>{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={t('chat.inputPlaceholder')}
              style={{
                flex: 1,
                minWidth: '220px',
                minHeight: '44px',
                padding: '12px 16px',
                background: 'var(--surface-1)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                color: 'var(--text-color)',
                fontSize: '14px',
                outline: 'none'
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                padding: '12px 24px',
                minHeight: '44px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                color: 'var(--navy-ink)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.5 : 1
              }}
            >
              {t('chat.send')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </AppShell>
  );
}

export default Chat;
