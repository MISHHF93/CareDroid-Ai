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
