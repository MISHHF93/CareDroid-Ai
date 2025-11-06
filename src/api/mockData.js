// Mock data for local development - NO external dependencies!

export const mockData = {
  protocols: [
    {
      id: '1',
      condition: 'Acute Myocardial Infarction (STEMI)',
      category: 'Cardiology',
      urgency: 'emergency',
      evidence_level: 'Level A',
      overview: 'Immediate management of ST-elevation myocardial infarction including primary PCI within 90 minutes.',
      created_date: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      condition: 'Sepsis and Septic Shock',
      category: 'Emergency Medicine',
      urgency: 'emergency',
      evidence_level: 'Level A',
      overview: 'Early goal-directed therapy for sepsis including fluid resuscitation, antibiotics within 1 hour, and vasopressors.',
      created_date: '2024-01-10T10:00:00Z'
    },
    {
      id: '3',
      condition: 'Diabetic Ketoacidosis (DKA)',
      category: 'Endocrinology',
      urgency: 'urgent',
      evidence_level: 'Level A',
      overview: 'Management protocol including IV fluids, insulin therapy, and electrolyte monitoring.',
      created_date: '2024-01-12T10:00:00Z'
    },
    {
      id: '4',
      condition: 'Community-Acquired Pneumonia',
      category: 'Pulmonology',
      urgency: 'urgent',
      evidence_level: 'Level B',
      overview: 'Antibiotic selection based on CURB-65 score and local resistance patterns.',
      created_date: '2024-01-08T10:00:00Z'
    },
    {
      id: '5',
      condition: 'Hypertensive Emergency',
      category: 'Cardiology',
      urgency: 'emergency',
      evidence_level: 'Level B',
      overview: 'Immediate BP reduction with IV antihypertensives to prevent end-organ damage.',
      created_date: '2024-01-14T10:00:00Z'
    },
  ],

  procedures: [
    {
      id: '1',
      name: 'Central Venous Catheter Insertion',
      category: 'Vascular Access',
      difficulty: 'Advanced',
      duration: '30-45 minutes',
      overview: 'Ultrasound-guided central line placement in internal jugular, subclavian, or femoral vein.',
      created_date: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      name: 'Lumbar Puncture',
      category: 'Diagnostic',
      difficulty: 'Intermediate',
      duration: '15-30 minutes',
      overview: 'Collection of cerebrospinal fluid for diagnostic purposes.',
      created_date: '2024-01-12T10:00:00Z'
    },
    {
      id: '3',
      name: 'Endotracheal Intubation',
      category: 'Airway Management',
      difficulty: 'Advanced',
      duration: '5-15 minutes',
      overview: 'Emergency airway management with direct laryngoscopy or video laryngoscopy.',
      created_date: '2024-01-09T10:00:00Z'
    },
  ],

  labValues: [
    {
      id: '1',
      test_name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      normal_range: 'WBC: 4-11 K/µL, Hgb: 12-16 g/dL (F), 14-18 g/dL (M), Plt: 150-400 K/µL',
      clinical_significance: 'Screens for anemia, infection, and blood disorders',
      created_date: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      test_name: 'Basic Metabolic Panel (BMP)',
      category: 'Chemistry',
      normal_range: 'Na: 135-145 mEq/L, K: 3.5-5.0 mEq/L, Cr: 0.6-1.2 mg/dL, Glucose: 70-100 mg/dL',
      clinical_significance: 'Evaluates electrolytes, kidney function, and blood sugar',
      created_date: '2024-01-10T10:00:00Z'
    },
    {
      id: '3',
      test_name: 'Troponin I',
      category: 'Cardiology',
      normal_range: '<0.04 ng/mL',
      clinical_significance: 'Cardiac biomarker for myocardial infarction',
      created_date: '2024-01-10T10:00:00Z'
    },
  ],

  auditLogs: [
    {
      id: '1',
      action_type: 'view_protocol',
      resource_accessed: 'Acute Myocardial Infarction Protocol',
      user_role: 'physician',
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: '2',
      action_type: 'use_calculator',
      resource_accessed: 'CHADS2-VASc Score Calculator',
      user_role: 'physician',
      created_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
    {
      id: '3',
      action_type: 'view_drug',
      resource_accessed: 'Warfarin Drug Information',
      user_role: 'physician',
      created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    },
    {
      id: '4',
      action_type: 'search_query',
      resource_accessed: 'Pneumonia Treatment Guidelines',
      search_query: 'community acquired pneumonia',
      user_role: 'physician',
      created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    },
  ],

  medicalImages: [
    {
      id: '1',
      title: 'Chest X-Ray - Normal',
      modality: 'X-Ray',
      body_region: 'Chest',
      url: 'https://via.placeholder.com/400x500?text=Normal+Chest+X-Ray',
      created_date: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      title: 'CT Brain - Acute Stroke',
      modality: 'CT',
      body_region: 'Brain',
      url: 'https://via.placeholder.com/400x400?text=CT+Brain+Stroke',
      created_date: '2024-01-12T10:00:00Z'
    },
  ],

  savedQueries: [
    {
      id: '1',
      query_text: 'anticoagulation in atrial fibrillation',
      category: 'Cardiology',
      created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: '2',
      query_text: 'diabetic ketoacidosis management',
      category: 'Endocrinology',
      created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
  ],

  clinicalNotes: [
    {
      id: '1',
      title: 'Patient Encounter - Chest Pain',
      content: 'HPI: 65yo M with h/o HTN, DM presents with chest pain...',
      created_date: new Date().toISOString(),
    },
  ],

  drugs: [
    {
      id: '1',
      name: 'Aspirin',
      generic_name: 'Acetylsalicylic Acid',
      class: 'Antiplatelet',
      indications: 'Acute coronary syndrome, stroke prevention, pain/fever',
      contraindications: 'Active bleeding, severe liver disease',
      created_date: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      name: 'Metformin',
      generic_name: 'Metformin Hydrochloride',
      class: 'Biguanide',
      indications: 'Type 2 diabetes mellitus',
      contraindications: 'Renal impairment (eGFR <30), metabolic acidosis',
      created_date: '2024-01-10T10:00:00Z'
    },
  ],
};
