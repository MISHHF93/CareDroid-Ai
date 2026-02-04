/**
 * Tool Card Component
 * 
 * Displays clinical tool results within chat messages
 * Supports SOFA Calculator, Drug Checker, Lab Interpreter, and other tools
 */

import React from 'react';
import Card from './ui/card';

const Title = ({ level = 3, style, children }) => {
  const Tag = `h${level}`;
  return <Tag style={style}>{children}</Tag>;
};

const Text = ({ style, children, strong = false, type }) => {
  const colors = {
    secondary: '#6b7280',
    danger: '#dc2626',
  };
  const Tag = strong ? 'strong' : 'span';
  return <Tag style={{ color: colors[type] || undefined, ...style }}>{children}</Tag>;
};

const Paragraph = ({ style, children }) => <p style={style}>{children}</p>;

const Divider = ({ style }) => (
  <hr
    style={{
      border: 'none',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      margin: '8px 0',
      ...style,
    }}
  />
);

const Badge = ({ count, style, status, text }) => {
  if (text) {
    const statusColors = {
      error: '#dc2626',
      warning: '#f59e0b',
      processing: '#2563eb',
      success: '#16a34a',
    };
    const color = statusColors[status] || '#6b7280';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...style }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
        <span style={{ color }}>{text}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: '20px',
        padding: '2px 8px',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        ...style,
      }}
    >
      {count}
    </span>
  );
};

const Alert = ({ message, description, type = 'info', style }) => {
  const colors = {
    info: { bg: '#e6f4ff', border: '#91caff' },
    warning: { bg: '#fff7e6', border: '#ffd666' },
    error: { bg: '#fff1f0', border: '#ffa39e' },
    success: { bg: '#f6ffed', border: '#b7eb8f' },
  };
  const palette = colors[type] || colors.info;

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: '8px',
        padding: '10px 12px',
        ...style,
      }}
    >
      {message && <div style={{ fontWeight: 600, marginBottom: description ? '6px' : 0 }}>{message}</div>}
      {description && <div>{description}</div>}
    </div>
  );
};

const ToolCard = ({ toolResult }) => {
  if (!toolResult) return null;

  const { toolId, toolName, result } = toolResult;
  const { data, interpretation, citations, warnings, errors, disclaimer, timestamp } = result;

  // Determine tool-specific rendering
  const renderToolContent = () => {
    switch (toolId) {
      case 'sofa-calculator':
        return renderSofaCalculator(data);
      case 'drug-interaction-checker':
        return renderDrugChecker(data);
      case 'lab-interpreter':
        return renderLabInterpreter(data);
      default:
        return renderGenericTool(data);
    }
  };

  return (
    <Card
      className="tool-result-card"
      style={{
        marginTop: '12px',
        marginBottom: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '12px',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#fff',
          fontWeight: 600,
          padding: '12px 16px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }} aria-hidden>
            🧪
          </span>
          <span>{toolName}</span>
        </div>
      </div>
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px' }}>
      {/* Interpretation */}
      {interpretation && (
        <Alert
          message={interpretation}
          type={errors?.length > 0 ? 'error' : warnings?.length > 0 ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Tool-specific content */}
      {renderToolContent()}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <Alert
          message="Warnings"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          }
          type="warning"
          style={{ marginTop: '16px' }}
        />
      )}

      {/* Citations */}
      {citations && citations.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Divider />
          <Text style={{ fontSize: '12px' }}>
            ℹ️ <strong>References:</strong>
          </Text>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
            {citations.map((citation, idx) => (
              <li key={idx}>
                {citation.title} - {citation.reference}
                {citation.url && (
                  <>
                    {' '}
                    <a href={citation.url} target="_blank" rel="noopener noreferrer">
                      [Link]
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <Paragraph
          style={{
            fontSize: '11px',
            marginTop: '16px',
            marginBottom: 0,
            fontStyle: 'italic',
          }}
        >
          ⚠️ {disclaimer}
        </Paragraph>
      )}

      {/* Timestamp */}
      {timestamp && (
        <Text style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
          Executed at {new Date(timestamp).toLocaleString()}
        </Text>
      )}
      </div>
    </Card>
  );
};

// ========================================
// SOFA Calculator Renderer
// ========================================
const renderSofaCalculator = (data) => {
  const componentScores = [
    { label: 'Respiration', value: data.respirationScore, key: 'respiration' },
    { label: 'Coagulation', value: data.coagulationScore, key: 'coagulation' },
    { label: 'Liver', value: data.liverScore, key: 'liver' },
    { label: 'Cardiovascular', value: data.cardiovascularScore, key: 'cardiovascular' },
    { label: 'CNS', value: data.cnsScore, key: 'cns' },
    { label: 'Renal', value: data.renalScore, key: 'renal' },
  ].filter((item) => item.value !== undefined);

  return (
    <div>
      {/* Total Score */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          {data.totalScore}
        </Title>
        <Text style={{ color: '#6b7280' }}>Total SOFA Score (0-24)</Text>
      </div>

      {/* Component Scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {componentScores.map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.label}</span>
            <Badge
              count={item.value}
              style={{
                backgroundColor: item.value === 0 ? '#52c41a' : item.value <= 2 ? '#faad14' : '#f5222d',
              }}
            />
          </div>
        ))}
      </div>

      {/* Mortality Estimate */}
      {data.mortalityEstimate && (
        <Alert
          message="Mortality Estimate"
          description={data.mortalityEstimate}
          type="info"
          style={{ marginTop: '16px' }}
        />
      )}
    </div>
  );
};

// ========================================
// Drug Checker Renderer
// ========================================
const renderDrugChecker = (data) => {
  if (!data.interactions || data.interactions.length === 0) {
    return (
      <Alert
        message="No Interactions Detected"
        description="No significant drug interactions were found."
        type="success"
      />
    );
  }

  // Group by severity
  const groupedInteractions = {
    contraindicated: data.interactions.filter((i) => i.severity === 'contraindicated'),
    major: data.interactions.filter((i) => i.severity === 'major'),
    moderate: data.interactions.filter((i) => i.severity === 'moderate'),
    minor: data.interactions.filter((i) => i.severity === 'minor'),
  };

  return (
    <div>
      <Text strong>Found {data.interactions.length} Interaction(s)</Text>
      <Divider style={{ margin: '12px 0' }} />

      {/* Contraindicated */}
      {groupedInteractions.contraindicated.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Badge status="error" text={<Text strong>Contraindicated</Text>} />
          <ul style={{ marginTop: '8px' }}>
            {groupedInteractions.contraindicated.map((interaction, idx) => (
              <li key={idx}>
                <Text strong>
                  {interaction.drug1} + {interaction.drug2}
                </Text>
                : {interaction.description}
                {interaction.recommendation && (
                  <>
                    <br />
                    <Text type="danger" style={{ fontSize: '12px' }}>
                      ⚠️ {interaction.recommendation}
                    </Text>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Major */}
      {groupedInteractions.major.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Badge status="warning" text={<Text strong>Major</Text>} />
          <ul style={{ marginTop: '8px' }}>
            {groupedInteractions.major.map((interaction, idx) => (
              <li key={idx}>
                <Text strong>
                  {interaction.drug1} + {interaction.drug2}
                </Text>
                : {interaction.description}
                {interaction.recommendation && (
                  <>
                    <br />
                    <Text type="danger" style={{ fontSize: '12px' }}>
                      ⚠️ {interaction.recommendation}
                    </Text>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Moderate */}
      {groupedInteractions.moderate.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Badge status="processing" text={<Text strong>Moderate</Text>} />
          <ul style={{ marginTop: '8px' }}>
            {groupedInteractions.moderate.slice(0, 3).map((interaction, idx) => (
              <li key={idx}>
                <Text>
                  {interaction.drug1} + {interaction.drug2}
                </Text>
                : {interaction.description}
                {interaction.recommendation && (
                  <>
                    <br />
                    <Text type="danger" style={{ fontSize: '12px' }}>
                      ⚠️ {interaction.recommendation}
                    </Text>
                  </>
                )}
              </li>
            ))}
            {groupedInteractions.moderate.length > 3 && (
              <li>
                <Text type="secondary">
                  ... and {groupedInteractions.moderate.length - 3} more moderate interaction(s)
                </Text>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ========================================
// Lab Interpreter Renderer
// ========================================
const renderLabInterpreter = (data) => {
  const hasAbnormal = data.summary?.abnormal > 0;
  const hasCritical = data.summary?.critical > 0;
  const formatValue = (value) => (typeof value === 'number' ? value.toFixed(1) : value);

  return (
    <div>
      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <Text>
            {data.summary.abnormal} of {data.summary.total} values abnormal
          </Text>
          {hasCritical && (
            <>
              {' '}
              <Badge count={`${data.summary.critical} critical`} style={{ backgroundColor: '#f5222d' }} />
            </>
          )}
        </div>
      )}

      {/* Critical Values */}
      {data.criticalValues && data.criticalValues.length > 0 && (
        <Alert
          message="Critical Values"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {data.criticalValues.map((lab, idx) => (
                <li key={idx}>
                  <Text strong>{lab.name}</Text>: {lab.value} {lab.unit} (
                  <Text type="danger">{lab.status}</Text>)
                </li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Interpretations by Category */}
      {data.interpretations && data.interpretations.length > 0 && (
        <div>
          {data.interpretations.map((interp, idx) => (
            <div key={idx} style={{ marginBottom: '16px' }}>
              <Title level={5} style={{ marginBottom: '8px' }}>
                {interp.category}
              </Title>
              <Paragraph style={{ margin: '0 0 8px 0' }}>{interp.clinicalSignificance}</Paragraph>
              {interp.suggestedActions && interp.suggestedActions.length > 0 && (
                <>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Suggested Actions:
                  </Text>
                  <ul style={{ marginTop: '4px', paddingLeft: '20px', fontSize: '12px' }}>
                    {interp.suggestedActions.map((action, actionIdx) => (
                      <li key={actionIdx}>{action}</li>
                    ))}
                  </ul>
                </>
              )}
              {idx < data.interpretations.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}

      {/* All Lab Values */}
      {data.labValues && data.labValues.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Divider />
          <Text strong>All Lab Values</Text>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {data.labValues.map((lab, idx) => (
              <li key={idx}>
                <Text strong>{lab.name}</Text>: {formatValue(lab.value)} {lab.unit} ({lab.referenceRange})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ========================================
// Generic Tool Renderer
// ========================================
const renderGenericTool = (data) => {
  return (
    <div>
      <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default ToolCard;
