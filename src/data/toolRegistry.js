const toolRegistry = [
  {
    id: 'drug-check',
    icon: '💊',
    name: 'Drug Checker',
    path: '/tools/drug-checker',
    color: '#FF6B9D',
    description: 'Check drug interactions, contraindications, and dosing',
    shortcut: 'Ctrl+1',
    category: 'Diagnostic',
    features: [
      'Drug-drug interaction checking',
      'Contraindication warnings',
      'Dosage recommendations',
      'Adverse effects database',
      'Renal/hepatic adjustments'
    ],
    useCases: [
      'Polypharmacy management',
      'New prescription safety check',
      'Patient medication review'
    ]
  },
  {
    id: 'lab-interp',
    icon: '🧪',
    name: 'Lab Interpreter',
    path: '/tools/lab-interpreter',
    color: '#4ECDC4',
    description: 'Interpret lab values and diagnostic tests',
    shortcut: 'Ctrl+2',
    category: 'Diagnostic',
    features: [
      'Reference range comparison',
      'Trend analysis',
      'Clinical significance explanation',
      'Critical value alerts',
      'Test correlation insights'
    ],
    useCases: [
      'Lab result interpretation',
      'Abnormal value investigation',
      'Serial lab monitoring'
    ]
  },
  {
    id: 'calculators',
    icon: '📊',
    name: 'Medical Calculators',
    path: '/tools/calculators',
    color: '#95E1D3',
    description: 'Medical calculators (GFR, BMI, scores, etc.)',
    shortcut: 'Ctrl+3',
    category: 'Calculator',
    features: [
      'GFR/CrCl calculation',
      'BMI and body surface area',
      'Risk scores (CHADS2, HEART, etc.)',
      'Fluid/electrolyte calculators',
      'Pediatric dosing calculators'
    ],
    useCases: [
      'Risk stratification',
      'Dose calculation',
      'Clinical decision support'
    ]
  },
  {
    id: 'protocols',
    icon: '📋',
    name: 'Clinical Protocols',
    path: '/tools/protocols',
    color: '#A8E6CF',
    description: 'Evidence-based clinical protocols and guidelines',
    shortcut: 'Ctrl+4',
    category: 'Reference',
    features: [
      'Specialty-specific protocols',
      'Emergency algorithms',
      'Treatment pathways',
      'Evidence-based guidelines',
      'Institution protocols'
    ],
    useCases: [
      'Acute care management',
      'Standard of care reference',
      'Quality improvement'
    ]
  },
  {
    id: 'diagnosis',
    icon: '🔍',
    name: 'Diagnosis Assistant',
    path: '/tools/diagnosis',
    color: '#FFD93D',
    description: 'Differential diagnosis and diagnostic support',
    shortcut: 'Ctrl+5',
    category: 'Diagnostic',
    features: [
      'Symptom-based differentials',
      'Diagnostic criteria lookup',
      'Pattern recognition',
      'Clinical decision trees',
      'Rare disease identification'
    ],
    useCases: [
      'Differential diagnosis generation',
      'Diagnostic workup planning',
      'Complex case analysis'
    ]
  },
  {
    id: 'procedures',
    icon: '⚕️',
    name: 'Procedure Guide',
    path: '/tools/procedures',
    color: '#6BCB77',
    description: 'Procedural guidance and step-by-step instructions',
    shortcut: 'Ctrl+6',
    category: 'Reference',
    features: [
      'Step-by-step instructions',
      'Equipment checklists',
      'Complication management',
      'Contraindication warnings',
      'Video demonstrations'
    ],
    useCases: [
      'Procedure preparation',
      'Complication troubleshooting',
      'Training reference'
    ]
  }
];

export const toolRegistryById = toolRegistry.reduce((acc, tool) => {
  acc[tool.id] = tool;
  return acc;
}, {});

export const getToolById = (toolId) => toolRegistryById[toolId] || null;

export default toolRegistry;
