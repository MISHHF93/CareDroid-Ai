export const featureInventory = [
  {
    id: 'drug-interactions',
    type: 'tool',
    category: 'Clinical Tools',
    name: 'Drug Interactions',
    icon: '💊',
    description: 'Check medication interactions',
    prompt: 'Check interactions between warfarin and aspirin.'
  },
  {
    id: 'calculators',
    type: 'tool',
    category: 'Clinical Tools',
    name: 'Medical Calculators',
    icon: '🧮',
    description: 'SOFA, APACHE, CHA2DS2-VASc',
    prompt: 'Calculate SOFA score for: PaO2/FiO2 180, platelets 90, bilirubin 2.4, MAP 62, GCS 12, creatinine 1.9.',
    highlights: [
      { title: 'SOFA Score', subtitle: 'Sepsis assessment' },
      { title: 'CHA2DS2-VASc', subtitle: 'Stroke risk' },
      { title: 'GFR', subtitle: 'Kidney function' },
      { title: 'BMI', subtitle: 'Body mass' }
    ]
  },
  {
    id: 'protocols',
    type: 'tool',
    category: 'Clinical Tools',
    name: 'Clinical Protocols',
    icon: '📋',
    description: 'Evidence-based guidelines',
    prompt: 'Summarize the sepsis protocol for initial management in the ED.'
  },
  {
    id: 'lab-interpreter',
    type: 'tool',
    category: 'Clinical Tools',
    name: 'Lab Interpreter',
    icon: '🧪',
    description: 'Interpret lab values',
    prompt: 'Interpret: Na 128, K 5.2, Cr 2.1, WBC 15.2, lactate 3.1.'
  },
  {
    id: 'diagnosis',
    type: 'tool',
    category: 'Clinical Tools',
    name: 'Differential Diagnosis',
    icon: '🔍',
    description: 'Generate DDx',
    prompt: 'Generate a differential for chest pain with diaphoresis and nausea.'
  },
  {
    id: 'procedures',
    type: 'tool',
    category: 'Clinical Tools',
    name: 'Procedures',
    icon: '⚕️',
    description: 'Step-by-step guides',
    prompt: 'Give a step-by-step guide for central line placement.'
  },
  {
    id: 'ai-workflow',
    type: 'feature',
    category: 'AI Workflow',
    name: 'AI Workflow Assistant',
    icon: '🧠',
    description: 'Guided clinical workflows and checklists',
    prompt: 'Create a sepsis workflow checklist for ED admission.'
  },
  {
    id: 'audit-logging',
    type: 'feature',
    category: 'Compliance',
    name: 'Audit Logging',
    icon: '🧾',
    description: 'HIPAA/GDPR audit trails for access and actions',
    prompt: 'Show how to review audit logs for patient record access.'
  },
  {
    id: 'drug-database',
    type: 'feature',
    category: 'Clinical Data',
    name: 'Drug Database',
    icon: '📚',
    description: 'Comprehensive medication reference and dosing info',
    prompt: 'Provide dosing guidance for amoxicillin in adults.'
  },
  {
    id: 'offline-access',
    type: 'feature',
    category: 'Platform',
    name: 'Offline Access',
    icon: '📶',
    description: 'Use key clinical tools without connectivity',
    prompt: 'What features are available offline?' 
  },
  {
    id: 'fhir-hl7-dicom',
    type: 'feature',
    category: 'Integrations',
    name: 'FHIR/HL7/DICOM Integration',
    icon: '🔗',
    description: 'Interoperability with EHR and imaging systems',
    prompt: 'Explain how to integrate FHIR data sources.'
  },
  {
    id: 'custom-branding',
    type: 'feature',
    category: 'Platform',
    name: 'Custom Branding',
    icon: '🎨',
    description: 'White-labeling and tenant branding options',
    prompt: 'How do I configure custom branding for an institution?'
  },
  {
    id: 'dedicated-support',
    type: 'feature',
    category: 'Support',
    name: 'Dedicated Support',
    icon: '🛟',
    description: 'Priority support for enterprise deployments',
    prompt: 'What is included in dedicated support?' 
  },
  {
    id: 'sso-saml',
    type: 'feature',
    category: 'Security',
    name: 'SSO/SAML',
    icon: '🔐',
    description: 'Enterprise single sign-on and identity federation',
    prompt: 'What is required to enable SSO/SAML integration?'
  },
  {
    id: 'team-management',
    type: 'feature',
    category: 'Operations',
    name: 'Team Management',
    icon: '👥',
    description: 'Roles, permissions, and multi-user administration',
    prompt: 'How do I manage roles and permissions?'
  },
  {
    id: 'ai-query-limits',
    type: 'feature',
    category: 'AI Usage',
    name: 'AI Query Limits',
    icon: '⚡',
    description: 'Daily AI query thresholds by plan tier',
    prompt: 'What are the AI query limits for each plan?'
  }
];

export const getInventoryItem = (id) => featureInventory.find((item) => item.id === id);
