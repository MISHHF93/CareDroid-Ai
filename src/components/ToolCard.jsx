/**
 * Tool Card Component
 * 
 * Displays clinical tool results within chat messages
 * Supports SOFA Calculator, Drug Checker, Lab Interpreter, and other tools
 */

import React from 'react';
import { Card, Table, Badge, Alert, Typography, Divider } from 'antd';
import {
  ExperimentOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

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
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExperimentOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <span>{toolName}</span>
        </div>
      }
      bordered
      style={{
        marginTop: '12px',
        marginBottom: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '12px',
      }}
      headStyle={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
        color: '#fff',
        fontWeight: 600,
      }}
      bodyStyle={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
      }}
    >
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
          icon={<WarningOutlined />}
          style={{ marginTop: '16px' }}
        />
      )}

      {/* Citations */}
      {citations && citations.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Divider />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <InfoCircleOutlined /> <strong>References:</strong>
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
          type="secondary"
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
        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
          Executed at {new Date(timestamp).toLocaleString()}
        </Text>
      )}
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
        <Text type="secondary">Total SOFA Score (0-24)</Text>
      </div>

      {/* Component Scores */}
      <Table
        dataSource={componentScores}
        columns={[
          {
            title: 'Organ System',
            dataIndex: 'label',
            key: 'label',
          },
          {
            title: 'Score',
            dataIndex: 'value',
            key: 'value',
            align: 'center',
            render: (score) => (
              <Badge
                count={score}
                style={{
                  backgroundColor: score === 0 ? '#52c41a' : score <= 2 ? '#faad14' : '#f5222d',
                }}
              />
            ),
          },
        ]}
        pagination={false}
        size="small"
      />

      {/* Mortality Estimate */}
      {data.mortalityEstimate && (
        <Alert
          message="Mortality Estimate"
          description={data.mortalityEstimate}
          type="info"
          showIcon
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
        icon={<CheckCircleOutlined />}
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
      <Text strong>Found {data.interactions.length} interaction(s)</Text>
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

      {/* All Lab Values Table */}
      {data.labValues && data.labValues.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Divider />
          <Text strong>All Lab Values</Text>
          <Table
            dataSource={data.labValues}
            columns={[
              { title: 'Test', dataIndex: 'name', key: 'name' },
              {
                title: 'Value',
                dataIndex: 'value',
                key: 'value',
                render: (value, record) => (
                  <>
                    {value} {record.unit}
                  </>
                ),
              },
              { title: 'Reference', dataIndex: 'referenceRange', key: 'referenceRange' },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                  const statusConfig = {
                    normal: { color: 'success', text: 'Normal' },
                    high: { color: 'warning', text: 'High' },
                    low: { color: 'warning', text: 'Low' },
                    'critical-high': { color: 'error', text: 'Critical High' },
                    'critical-low': { color: 'error', text: 'Critical Low' },
                  };
                  const config = statusConfig[status] || { color: 'default', text: status };
                  return <Badge status={config.color} text={config.text} />;
                },
              },
            ]}
            pagination={false}
            size="small"
            style={{ marginTop: '8px' }}
          />
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
