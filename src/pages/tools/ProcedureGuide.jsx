import SearchableToolPage from './SearchableToolPage';

const ProcedureGuide = () => {
  const toolConfig = {
    id: 'procedures',
    icon: '⚕️',
    name: 'Procedure Guide',
    path: '/tools/procedures',
    color: '#6BCB77',
    description: 'Procedural guidance and step-by-step instructions',
    shortcut: 'Ctrl+6',
    category: 'Reference'
  };

  const commonProcedures = [
    'Central Line Placement',
    'Lumbar Puncture',
    'Intubation',
    'Chest Tube Insertion',
    'Arterial Line',
    'Paracentesis',
    'Thoracentesis',
    'Nasogastric Tube',
    'Foley Catheter',
    'Wound Closure',
  ];

  return (
    <SearchableToolPage
      toolConfig={toolConfig}
      commonItems={commonProcedures}
      placeholder="Search for a procedure (e.g., Central line, Intubation)..."
      searchPrompt="Provide a step-by-step guide for the following procedure"
      errorMessage="Error loading procedure guide. Please try again."
    />
  );
};

export default ProcedureGuide;

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(0,255,136,0.2)', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px' }}>Loading procedure guide...</p>
          </div>
        ) : results ? (
          <div style={{ background: 'var(--panel-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {results}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>⚕️</div>
            <p>Search for a procedure or click a common procedure above</p>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default ProcedureGuide;
