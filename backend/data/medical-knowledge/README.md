# Sample Medical Documents for RAG Testing

This directory contains sample medical documents for testing the RAG (Retrieval-Augmented Generation) system.

## Structure

- `protocols/` - Clinical protocols (ACLS, ATLS, PALS, etc.)
- `guidelines/` - Clinical practice guidelines
- `drug-info/` - FDA drug information and pharmacology references
- `pathways/` - Clinical care pathways and order sets
- `reference/` - General medical reference material

## Usage

### Ingest Documents

```bash
# Ingest all documents in this directory
npm run ingest -- --directory backend/data/medical-knowledge/

# Ingest a specific document
npm run ingest -- --file backend/data/medical-knowledge/protocols/acls-protocol.txt --type protocol

# Ingest with custom organization
npm run ingest -- --file backend/data/medical-knowledge/protocols/acls-protocol.txt --type protocol --organization "American Heart Association"
```

### Document Format

Documents should be plain text (.txt) or Markdown (.md) files. The system will:
1. Automatically detect document type from filename/content
2. Extract title from first line or filename
3. Chunk the document into overlapping segments
4. Generate embeddings for each chunk
5. Store in Pinecone vector database

### Best Practices

1. **File Naming**: Use descriptive names like `acls-cardiac-arrest-protocol.txt`
2. **Organization**: Group similar documents in subdirectories
3. **Metadata**: Use command-line flags to add organization and specialty metadata
4. **Quality**: Ensure documents are well-formatted and contain accurate medical information

## Sample Documents

### ACLS Protocol (Example)

Create a file: `protocols/acls-protocol.txt`

```
# Advanced Cardiac Life Support (ACLS) - Cardiac Arrest Protocol

## Overview
Advanced Cardiac Life Support (ACLS) provides a systematic approach to the management of cardiac arrest and other cardiovascular emergencies.

## BLS Algorithm
1. Verify scene safety
2. Check for responsiveness
3. Activate emergency response system
4. Check for pulse and breathing (no more than 10 seconds)
5. Begin CPR if no pulse
   - Compression rate: 100-120/min
   - Compression depth: At least 2 inches (5 cm)
   - Allow full recoil
   - Minimize interruptions (<10 seconds)

## Rhythm Assessment
### Shockable Rhythms (VF/pVT)
1. Resume CPR immediately for 2 minutes
2. IV/IO access
3. Epinephrine every 3-5 minutes (1 mg)
4. Amiodarone 300 mg bolus, then 150 mg

### Non-Shockable Rhythms (PEA/Asystole)
1. Resume CPR immediately for 2 minutes
2. IV/IO access
3. Epinephrine every 3-5 minutes (1 mg)
4. Treat reversible causes (H's and T's)

## Reversible Causes (H's and T's)
- Hypovolemia
- Hypoxia
- Hydrogen ion (acidosis)
- Hypo/hyperkalemia
- Hypothermia
- Tension pneumothorax
- Tamponade (cardiac)
- Toxins
- Thrombosis (pulmonary/coronary)

## Post-Cardiac Arrest Care
1. Optimize ventilation and oxygenation
2. Treat hypotension (SBP <90 mmHg)
3. Consider targeted temperature management
4. Identify and treat ACS
5. Advanced critical care
```

### Drug Information (Example)

Create a file: `drug-info/epinephrine.txt`

```
# Epinephrine - Pharmacology and Clinical Use

## Generic Name
Epinephrine (Adrenaline)

## Classification
Alpha/Beta Adrenergic Agonist, Sympathomimetic

## Indications
- Cardiac arrest (VF, pVT, PEA, asystole)
- Anaphylaxis
- Severe bronchospasm
- Bradycardia (when pacing unavailable)

## Mechanism of Action
Direct-acting sympathomimetic amine that stimulates:
- Alpha-1 receptors: Peripheral vasoconstriction, increased SVR
- Beta-1 receptors: Increased heart rate, contractility, automaticity
- Beta-2 receptors: Bronchodilation (at lower doses)

## Dosing

### Cardiac Arrest
- IV/IO: 1 mg (1:10,000) every 3-5 minutes
- No maximum dose

### Anaphylaxis
- IM: 0.3-0.5 mg (1:1,000) into anterolateral thigh
- May repeat every 5-15 minutes

### Bradycardia
- IV infusion: 2-10 mcg/min, titrate to effect

## Pharmacokinetics
- Onset: IV: Immediate; IM: 3-5 minutes
- Duration: Brief (1-2 minutes IV)
- Metabolism: Hepatic, also by MAO and COMT
- Half-life: <5 minutes

## Contraindications
- Relative: Hypertension, coronary artery disease (non-arrest settings)
- Caution with MAO inhibitors (may prolong effect)

## Adverse Effects
- Tachycardia, palpitations
- Hypertension
- Myocardial ischemia
- Hyperglycemia
- Anxiety, tremor

## Clinical Pearls
- In cardiac arrest, higher doses do not improve outcomes
- Push epinephrine in cardiac arrest - don't delay for perfect IV access
- IM route preferred for anaphylaxis (faster absorption than subQ)
- Auto-injectors available for field use (EpiPen)
```

## Adding Your Own Documents

1. Place documents in appropriate subdirectories
2. Use plain text or Markdown format
3. Include clear section headers
4. Run ingestion script
5. Test retrieval with relevant queries

## Testing Retrieval

After ingesting documents, test retrieval in the application:

```typescript
// Example query
const context = await ragService.retrieve(
  'What is the dose of epinephrine in cardiac arrest?',
  { topK: 5, minScore: 0.7 }
);

console.log(`Found ${context.chunks.length} relevant chunks`);
console.log(`Confidence: ${context.confidence}`);
```

## Maintenance

- Periodically update documents with latest guidelines
- Remove outdated information
- Re-ingest updated documents (use same source ID to replace)
- Monitor retrieval quality and adjust chunking parameters if needed
