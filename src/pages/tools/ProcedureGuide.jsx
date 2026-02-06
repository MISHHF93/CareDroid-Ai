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
