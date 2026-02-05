import SearchableToolPage from './SearchableToolPage';

const Protocols = () => {
  const toolConfig = {
    id: 'protocols',
    icon: '📋',
    name: 'Clinical Protocols',
    path: '/tools/protocols',
    color: '#A8E6CF',
    description: 'Evidence-based clinical protocols and guidelines',
    shortcut: 'Ctrl+4',
    category: 'Reference'
  };

  const commonProtocols = [
    'Sepsis Management',
    'Acute MI/STEMI',
    'Stroke/TIA',
    'Anaphylaxis',
    'DKA Management',
    'COPD Exacerbation',
    'Pneumonia Treatment',
    'CHF Management',
    'VTE Prophylaxis',
    'Post-Op Care',
  ];

  return (
    <SearchableToolPage
      toolConfig={toolConfig}
      commonItems={commonProtocols}
      placeholder="Search for a protocol (e.g., Sepsis, STEMI, DKA)..."
      searchPrompt="Provide the clinical protocol for"
      errorMessage="Error loading protocol. Please try again."
    />
  );
};

export default Protocols;

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(0,255,136,0.2)', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px' }}>Loading protocol...</p>
          </div>
        ) : results ? (
          <div style={{ background: 'var(--panel-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {results}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
            <p>Search for a protocol or click a common protocol above</p>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default Protocols;
