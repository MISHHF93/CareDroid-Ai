# Tool Orchestrator Integration Research
**Date**: January 30, 2026  
**Status**: Phase 1 Implementation Planning

---

## Executive Summary

Care-Droid has a **mature Tool Orchestrator system** with 3 production tools already implemented and a complete infrastructure for tool management. However, **Claude API tool-calling is NOT yet integrated**. The current flow uses intent classification to route to tools, but doesn't leverage Claude's native tool-calling capabilities. This research identifies what exists, what's missing, and the precise changes needed for Phase 1.

---

## Current State: What We Have Today

### ✅ Tool Orchestrator Service (COMPLETE)
**Location**: `backend/src/modules/medical-control-plane/tool-orchestrator/`

**Status**: Production-ready
- **Service**: `ToolOrchestratorService` - central coordinator for all clinical tools
- **Registry**: 3 tools registered and working
- **API Controller**: `ToolOrchestratorController` - REST endpoints at `/tools`
- **Architecture**: Service-based with unified interface

**Key Methods**:
```typescript
listAvailableTools(): ToolListDto
getToolMetadata(toolId): ToolMetadata
validateToolExecution(dto): ValidationResult
executeTool(dto): ToolExecutionResponseDto
executeInChat(toolId, parameters, userId, conversationId): ChatToolResult
formatToolResultForChat(response): string
```

---

## Tool Definitions (3 Production Tools)

### 1. SOFA Score Calculator
**ID**: `sofa-calculator`  
**Category**: `calculator`  
**Status**: ✅ Fully implemented

**Input Schema** (12 parameters, all optional):
- `pao2` (number): PaO2 in mmHg, 0-700
- `fio2` (number): FiO2 fraction, 0.21-1.0
- `mechanicalVentilation` (boolean): On ventilator?
- `platelets` (number): Count in ×10³/μL, 0-1000
- `bilirubin` (number): Total bilirubin in mg/dL, 0-50
- `map` (number): Mean Arterial Pressure in mmHg, 0-200
- `dopamine` (number): Dopamine dose in μg/kg/min, 0-50
- `dobutamine` (number): Dobutamine dose, 0-50
- `epinephrine` (number): Epinephrine dose, 0-50
- `gcs` (number): Glasgow Coma Scale, 3-15
- `creatinine` (number): Serum creatinine in mg/dL
- `urineOutput` (number): Urine output in mL/kg/hour

**Output**:
```javascript
{
  totalScore: number,           // 0-24
  respirationScore: number,     // 0-4
  coagulationScore: number,     // 0-4
  liverScore: number,           // 0-4
  cardiovascularScore: number,  // 0-4
  cnsScore: number,             // 0-4
  renalScore: number,           // 0-4
  mortalityEstimate: string,    // "Low", "Moderate", "High", "Very High"
  interpretation: string,
  warnings: string[],
  disclaimer: string
}
```

**References**:
- Vincent JL, et al. SOFA score. Intensive Care Med. 1996;22(7):707-10
- Singer M, et al. Sepsis-3 Definitions. JAMA. 2016;315(8):801-810

---

### 2. Drug Interaction Checker
**ID**: `drug-interactions`  
**Category**: `checker`  
**Status**: ✅ Fully implemented

**Input Schema** (2 parameters):
- `medications` (array, **REQUIRED**): List of medication names (generic or brand), minimum 2, maximum 20
- `severityFilter` (string, optional): Filter by severity - `['all', 'contraindicated', 'major', 'moderate', 'minor']`

**Output**:
```javascript
{
  interactions: [
    {
      drug1: string,
      drug2: string,
      severity: 'contraindicated' | 'major' | 'moderate' | 'minor',
      mechanism: string,
      clinicalSignificance: string,
      management: string,
      description: string,
      recommendation: string
    }
  ],
  summary: {
    total: number,
    contraindicated: number,
    major: number,
    moderate: number,
    minor: number
  },
  warnings: string[],
  disclaimer: string
}
```

**Notes**:
- Currently uses AI service for lookups (marked for integration with DailyMed/Lexicomp API in production)
- Groups interactions by severity automatically
- Returns empty array if no interactions found

---

### 3. Lab Interpreter
**ID**: `lab-interpreter`  
**Category**: `interpreter`  
**Status**: ✅ Fully implemented

**Input Schema** (flexible, accepts any lab values):
- `labValues` (array): Lab test results with name, value, unit, reference range
- `patientContext` (object, optional): Age, sex, relevant conditions

**Output**:
```javascript
{
  summary: {
    total: number,
    normal: number,
    abnormal: number,
    critical: number
  },
  criticalValues: [
    {
      name: string,
      value: number,
      unit: string,
      status: 'critical-high' | 'critical-low',
      interpretation: string
    }
  ],
  interpretations: [
    {
      category: string,  // e.g., "Electrolytes", "Renal", "Hepatic"
      findings: string[],
      clinicalSignificance: string,
      suggestedActions: string[]
    }
  ],
  labValues: [
    {
      name: string,
      value: number,
      unit: string,
      referenceRange: string,
      status: 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low'
    }
  ],
  warnings: string[],
  disclaimer: string
}
```

**Supported Lab Categories**:
- Electrolytes (Na, K, Cl, CO2)
- Renal function (creatinine, BUN, GFR)
- Hepatic function (bilirubin, ALT, AST, albumin)
- Hematology (WBC, Hgb, Hct, platelets)
- Coagulation (PT, INR, aPTT)
- Metabolic (glucose, lactate, phosphate)

---

## Chat Integration Status

### Current Architecture (PARTIAL Implementation)

**Flow**: User Message → Intent Classification → Route to Handler → Tool Execution → Format Result

```
┌─────────────┐
│ User Input  │
└────┬────────┘
     │
     ▼
┌──────────────────────────────┐
│ Intent Classifier            │
│ - Detects: CLINICAL_TOOL,    │
│   MEDICAL_REFERENCE, GENERAL │
│ - Extracts tool ID           │
└────┬─────────────────────────┘
     │
     ├─── CLINICAL_TOOL intent ─┐
     │                           ▼
     │                  ┌─────────────────────┐
     │                  │ handleClinicalTool()│
     │                  │ - Extract params    │
     │                  │ - Validate tool     │
     │                  │ - Execute tool      │
     │                  │ - Format result     │
     │                  └────────┬────────────┘
     │                           │
     ├─── MEDICAL_REFERENCE ────┐│
     │                          ││
     │                          ▼▼
     │                   ┌──────────────────────┐
     │                   │ handleMedicalRef()   │
     │                   │ - RAG retrieve       │
     │                   │ - Invoke LLM with RAG│
     │                   └────────┬─────────────┘
     │                            │
     └─── GENERAL intent ─────────┤
                                  │
                                  ▼
                          ┌─────────────────┐
                          │ Chat Response   │
                          │ + Citations     │
                          │ + Confidence    │
                          └─────────────────┘
```

### Chat Service Integration Points

**File**: `backend/src/modules/chat/chat.service.ts`

**Key Flows**:

1. **Intent Classification** (Line 73-117)
   - Calls `IntentClassifierService.classify()`
   - Detects primary intent: `CLINICAL_TOOL | MEDICAL_REFERENCE | GENERAL`
   - Extracts `toolId` if clinical tool detected
   - Records metrics and audit log

2. **Tool Invocation** (Line 339-426)
   - If intent is `CLINICAL_TOOL`:
     - Gets tool metadata from `ToolOrchestratorService.getToolMetadata(toolId)`
     - Validates parameters (required vs optional)
     - If missing required params, uses AI to extract them from message
     - Calls `ToolOrchestratorService.validateToolExecution()`
     - Calls `ToolOrchestratorService.executeInChat()` ⬅️ **Main method**
     - Formats result for chat display

3. **Result Formatting** (Line 269-276)
   ```typescript
   return {
     text: toolResult.formattedForChat,      // Human-readable output
     suggestions: ['Calculate again', ...],
     visualizations: [{
       type: 'tool-result',
       data: { toolId, toolName, result, timestamp }
     }],
     intentClassification: classification,
     toolResult: toolResult.result          // Raw output for frontend
   };
   ```

---

## Current API Contracts

### Chat API: POST `/api/chat/message`

**Request**:
```typescript
{
  message: string,           // User input
  tool?: string,             // Optional tool selection
  feature?: string,          // Optional feature selection
  conversationId?: number    // Conversation tracking
}
```

**Response**:
```typescript
{
  response: string,          // Main text response
  metadata: {
    toolUsed?: string,
    featureUsed?: string,
    conversationId?: number,
    timestamp: number,
    intentClassification?: {
      primaryIntent: string,
      toolId?: string,
      confidence: number,
      extractedParameters?: Record<string, any>,
      isEmergency?: boolean,
      emergencySeverity?: string
    },
    emergencyAlert?: {
      severity: EmergencySeverity,
      message: string,
      requiresEscalation: boolean
    }
  }
}
```

**What's Missing**: No field for `citations`, `confidence`, `ragContext`, `toolResult` in the actual response (frontend expects them at top level)

---

### Tool API: `/tools` Endpoints

**GET `/tools`** - List all available tools
```javascript
{
  tools: [{
    id: string,
    name: string,
    description: string,
    category: string,
    version: string,
    parameters: ToolParameter[]
  }],
  count: number
}
```

**GET `/tools/:id`** - Get tool metadata
```javascript
{
  id: string,
  name: string,
  description: string,
  category: string,
  version: string,
  author: string,
  references: string[],
  parameters: [{
    name: string,
    type: string,
    required: boolean,
    description: string,
    validation?: { min, max, pattern, options }
  }]
}
```

**POST `/tools/:id/execute`** - Execute a tool directly
```javascript
// Request
{
  parameters: Record<string, any>,
  conversationId?: string
}

// Response
{
  toolId: string,
  toolName: string,
  success: boolean,
  result: {
    success: boolean,
    data: Record<string, any>,
    interpretation?: string,
    citations?: Array<{ title, url, reference }>,
    warnings?: string[],
    errors?: string[],
    disclaimer?: string,
    timestamp: Date
  },
  executionTimeMs: number
}
```

---

## Frontend Chat UI Status

### ChatInterface Component
**File**: `src/components/ChatInterface.jsx`

**Current Features** ✅:
- Sends messages to `/api/chat/message`
- Displays tool results via `ToolCard` component (if `message.toolResult` present)
- Shows citations with confidence badges
- Displays RAG context metadata
- Tool/Feature selection dock at top of chat

**Known Issues** ⚠️:
- Line 86: Typo in response parsing: `data.respons` should be `data.response`
- Response handler doesn't properly extract all fields from API response
- Frontend expects `citations`, `confidence`, `ragContext` but API returns them in `metadata`

### ToolCard Component
**File**: `src/components/ToolCard.jsx`

**Renders**:
- Tool-specific formatting for SOFA, Drug Checker, Lab Interpreter
- Severity badges and color coding
- Critical values alerts
- References and disclaimers
- Execution metrics

**Example Output** (from code):
```javascript
// What ToolCard receives
{
  toolId: 'sofa-calculator',
  toolName: 'SOFA Score Calculator',
  result: {
    success: true,
    data: {
      totalScore: 8,
      respirationScore: 2,
      coagulationScore: 1,
      // ... more scores
    },
    interpretation: "Moderate organ dysfunction...",
    warnings: [],
    disclaimer: "This is a clinical decision support tool...",
    timestamp: Date
  }
}
```

---

## What's Missing for Phase 1: Claude Tool Calling

### ❌ NOT YET IMPLEMENTED

The system **does NOT use Claude's `tool_use` capability**. Currently:

1. **Intent Classifier** detects tools and routes to them
   - ❌ Claude cannot invoke tools directly
   - ❌ No `tools` parameter in Claude API calls
   - ❌ No `tool_use` block parsing

2. **Parameter Extraction** is crude
   - Uses AI to extract from message when needed (Line 370-387)
   - ❌ Not using Claude's structured extraction
   - ❌ No native parameter validation

3. **Tool Result Processing** is manual
   - Orchestrator returns formatted text
   - ❌ Not using Claude's tool result blocks
   - ❌ No conversation continuation with tool output

---

## Required Changes (Ranked by Importance)

### 🔴 CRITICAL (Phase 1 - Enable Tool Calling)

#### **1. Extend AIService with Tool Definitions**
**Why**: Claude needs to know what tools exist and their schemas  
**Where**: `backend/src/modules/ai/ai.service.ts`  
**Effort**: 30 mins

```typescript
// Add to AIService
privategetToolDefinitions(): any[] {
  // Get all tools from ToolOrchestrator
  // Convert to Claude tool_use format
  // Return array of tool definitions
}

async invokeLLMWithTools(
  userId: string,
  prompt: string,
  tools: ToolDefinition[],
  context?: any
): Promise<{
  content: string,
  toolCalls?: { name: string, input: any }[],
  // ...
}>
```

#### **2. Create Tool-Calling Handler in ChatService**
**Why**: Parse Claude's tool_use blocks and execute tools  
**Where**: `backend/src/modules/chat/chat.service.ts`  
**Effort**: 1.5 hours

```typescript
// New method in ChatService
async processMessageWithToolCalling(
  message: string,
  userId: string,
  conversationId?: number
): Promise<QueryResponse> {
  // 1. Invoke Claude WITH tool definitions
  // 2. Parse response for tool_use blocks
  // 3. Execute tools concurrently
  // 4. Continue conversation with tool results
  // 5. Return final response
}
```

#### **3. Update Chat Controller Response Structure**
**Why**: Match actual response format on frontend  
**Where**: `backend/src/modules/chat/chat.controller.ts`  
**Effort**: 15 mins

**Current** (wrong):
```typescript
return {
  response: response.text,
  metadata: { /* all fields here */ }
}
```

**Should be**:
```typescript
return {
  response: response.text,      // Or rename to responseText
  citations: response.citations,
  confidence: response.confidence,
  ragContext: response.ragContext,
  toolResult: response.toolResult,
  intentClassification: response.intentClassification,
  emergencyAlert: response.emergencyAlert,
  timestamp: Date.now()
}
```

#### **4. Fix ChatInterface Frontend Bug**
**Why**: API response parsing is broken  
**Where**: `src/components/ChatInterface.jsx`, Line 86  
**Effort**: 5 mins

**Current** (broken):
```javascript
const assistantMessage = {
  role: 'assistant',
  content: data.respons,  // ❌ Typo!
  citations: data.citations || [],
  confidence: data.confidence,
  ragContext: data.ragContext,e || 'I encountered...',  // ❌ Syntax error!
  timestamp: new Date()
};
```

**Should be**:
```javascript
const assistantMessage = {
  role: 'assistant',
  content: data.response || data.responseText || 'I encountered an error processing your request.',
  citations: data.citations || [],
  confidence: data.confidence,
  ragContext: data.ragContext,
  timestamp: new Date()
};
```

---

### 🟠 HIGH PRIORITY (Phase 1 - Enhance Tool Calling)

#### **5. Add Intent Classification with Tool Context**
**Why**: Improve tool selection accuracy when Claude suggests a tool  
**Where**: `backend/src/modules/medical-control-plane/intent-classifier/`  
**Effort**: 45 mins

**Need**:
- Tool definitions in patterns
- Tool-to-intent mapping
- Confidence scoring for tool selection

#### **6. Implement Parallel Tool Execution**
**Why**: Some queries may invoke multiple tools simultaneously  
**Where**: `backend/src/modules/tool-orchestrator/tool-orchestrator.service.ts`  
**Effort**: 1 hour

```typescript
async executeMultipleTools(
  toolCalls: { toolId: string, parameters: any }[],
  userId: string,
  conversationId: string
): Promise<ChatToolResult[]>
```

#### **7. Add Conversation Memory/History**
**Why**: Claude needs full conversation context for multi-turn tool use  
**Where**: `backend/src/modules/chat/chat.service.ts`  
**Effort**: 2 hours

**Need**:
- Store conversation history (user + assistant messages)
- Retrieve last N messages for context
- Include tool execution history

---

### 🟡 MEDIUM PRIORITY (Phase 1 Polish)

#### **8. Tool Result Formatting Template System**
**Why**: Standardize how tools are presented to Claude and users  
**Where**: `backend/src/modules/medical-control-plane/tool-orchestrator/`  
**Effort**: 1 hour

#### **9. Test Tool Calling with Claude**
**Why**: Verify end-to-end flow works  
**Where**: `backend/test/` + `src/components/ChatInterface.test.jsx`  
**Effort**: 2 hours

#### **10. Add Tool Error Recovery**
**Why**: When tools fail, Claude should handle gracefully  
**Where**: `backend/src/modules/chat/chat.service.ts`  
**Effort**: 45 mins

---

## Architecture: How Tool Calling Should Work (Phase 1)

### Step-by-Step Flow

```
User Message
  │
  ▼
┌────────────────────────────────────────────┐
│ 1. Get Tool Definitions                    │
│ - Load from ToolOrchestratorService        │
│ - Convert to Claude tool_use format         │
│ - Include all parameters & descriptions    │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 2. Invoke Claude with Tools                │
│ messages: [                                │
│   { role: "user", content: message }       │
│ ],                                         │
│ tools: [                                   │
│   { type: "function",                      │
│     function: {                            │
│       name: "sofa_calculator",             │
│       description: "...",                  │
│       input_schema: { ... }                │
│     }                                      │
│   }                                        │
│ ]                                          │
│                                            │
│ Returns: content with tool_use blocks      │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 3. Parse Tool Calls from Response          │
│ Look for: [{ type: "tool_use",             │
│             id: "...",                     │
│             name: "sofa_calculator",       │
│             input: { ... } }]              │
│                                            │
│ Extract:                                   │
│ - Tool name → toolId                       │
│ - input → parameters                       │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 4. Execute Tools (Concurrently)            │
│                                            │
│ for each tool_call:                        │
│  - Validate parameters                     │
│  - Call ToolOrchestrator.executeTool()     │
│  - Capture result                          │
│  - Store execution time                    │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 5. Build Tool Result Blocks                │
│ For each tool result, create:              │
│ {                                          │
│   type: "tool_result",                     │
│   tool_use_id: "...",  // Link to call     │
│   content: JSON.stringify(result)          │
│ }                                          │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 6. Continue Conversation with Claude       │
│ New message sequence:                      │
│ [                                          │
│   { role: "user",                          │
│     content: "Calculate SOFA score for..." },│
│   { role: "assistant",                     │
│     content: "..." },  // With tool_use    │
│   { role: "user",                          │
│     content: [                             │
│       { type: "tool_result",               │
│         tool_use_id: "...",                │
│         content: "{...result...}" }        │
│     ] }                                    │
│ ]                                          │
│                                            │
│ Invoke Claude again to synthesize          │
│ response with tool results                 │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 7. Format and Return Response              │
│ {                                          │
│   response: "Based on the SOFA score...",  │
│   citations: [...],                        │
│   toolResult: { ... },                     │
│   confidence: 0.92,                        │
│   timestamp: Date.now()                    │
│ }                                          │
└────────────────────────────────────────────┘
```

### Example: SOFA Score Request

```
User: "Calculate SOFA score for: PaO2/FiO2 180, platelets 90, bilirubin 2.4, MAP 62, GCS 12, creatinine 1.9"

→ Claude sees tools and recognizes this needs sofa_calculator
→ Claude generates:
   {
     "type": "tool_use",
     "id": "sofa_001",
     "name": "sofa_calculator",
     "input": {
       "pao2": 180,
       "fio2": 0.4,  // Claude infers from PaO2/FiO2
       "platelets": 90,
       "bilirubin": 2.4,
       "map": 62,
       "gcs": 12,
       "creatinine": 1.9
     }
   }

→ ChatService executes sofa_calculator with these parameters
→ Returns: { totalScore: 8, respirationScore: 2, ... }

→ Claude continues (with tool result):
   "Based on the calculated SOFA score of 8:
    - Patient has moderate organ dysfunction (score 8/24)
    - Respiratory: 2/4 (PaO2/FiO2 180 on ventilation)
    - Coagulation: 1/4 (platelets 90)
    - Liver: 1/4 (bilirubin 2.4)
    - Cardiovascular: 2/4 (MAP 62, no vasopressors)
    - CNS: 1/4 (GCS 12)
    - Renal: 1/4 (creatinine 1.9)
    
    **Interpretation**: Early sepsis-related organ dysfunction. Monitor closely
    for deterioration and consider ICU placement."

→ Frontend receives & displays with ToolCard showing score breakdown
```

---

## Key Implementation Details

### Tool Definition to Claude Format

**Current (ToolOrchestratorService)**:
```typescript
{
  id: 'sofa-calculator',
  name: 'SOFA Score Calculator',
  description: 'Sequential Organ Failure Assessment...',
  category: 'calculator',
  parameters: [
    { name: 'pao2', type: 'number', required: false, ... },
    // ...
  ]
}
```

**Need to Convert To (Claude)**:
```javascript
{
  type: "function",
  function: {
    name: "sofa_calculator",  // Underscore, no hyphens
    description: "Sequential Organ Failure Assessment...",
    input_schema: {
      type: "object",
      properties: {
        pao2: {
          type: "number",
          description: "PaO2 (mmHg)",
          minimum: 0,
          maximum: 700
        },
        // ... (convert all parameters)
      },
      required: ["pao2", "fio2"]  // From required: true
    }
  }
}
```

---

## Data Model Changes Needed (If Any)

### Conversation History Storage

**Current**: No persistent conversation history in database

**Phase 1 Minimum**: Store conversation in memory
```typescript
interface StoredConversation {
  id: string,
  userId: string,
  messages: {
    role: 'user' | 'assistant',
    content: string | ContentBlock[],
    toolResults?: any[]
  }[],
  toolExecutions: {
    toolId: string,
    parameters: any,
    result: ToolExecutionResult,
    executedAt: Date,
    executionTimeMs: number
  }[],
  createdAt: Date,
  updatedAt: Date
}
```

**Note**: Current Message entity in spec supports this with `metadata: object`

---

## Frontend Changes Needed

### 1. Fix ChatInterface Response Handling
**Where**: `src/components/ChatInterface.jsx`, lines 78-101

**Current Code** (broken):
```javascript
const assistantMessage = {
  role: 'assistant',
  content: data.respons,  // ❌ Typo
  citations: data.citations || [],
  confidence: data.confidence,
  ragContext: data.ragContext,e || 'I encountered...',  // ❌ Syntax error
  timestamp: new Date()
};
```

### 2. Display Tool Results
**Status**: ✅ Already working
- `ToolCard.jsx` handles rendering
- Supports: SOFA, Drug Checker, Lab Interpreter
- Needs minor CSS updates for consistency

### 3. Update Message Display for Tool Use
**Currently**: Shows tool results inline (good!)
**Need to Add**: 
- Visual indicator when Claude suggests a tool
- Loading state during tool execution
- Error display for failed tools

---

## Summary: What's Ready vs. What's Missing

| Component | Status | Notes |
|-----------|--------|-------|
| **Tool Orchestrator Service** | ✅ Complete | 3 tools implemented, fully working |
| **Tool API Endpoints** | ✅ Complete | `/tools` endpoints ready |
| **Tool Execution Pipeline** | ✅ Complete | executeInChat() working |
| **Intent Classification** | ✅ Complete | Detects tools and routes |
| **Chat Service** | ✅ ~80% | Missing tool-calling integration |
| **Chat Controller** | ⚠️ Partial | Response structure mismatch |
| **ChatInterface Component** | ⚠️ Partial | Has typos, response parsing broken |
| **ToolCard Component** | ✅ Complete | Renders results beautifully |
| **Claude Tool Calling** | ❌ Missing | Not implemented at all |
| **Tool Definitions in Claude** | ❌ Missing | Need to convert tools to tool_use format |
| **Tool Result Parsing** | ❌ Missing | Need to handle Claude's tool_use blocks |
| **Multi-Turn Conversations** | ❌ Missing | No history tracking yet |
| **Parallel Tool Execution** | ⚠️ Not Needed | Single tool at a time is fine for Phase 1 |

---

## Effort Estimation for Phase 1

| Task | Priority | Effort | Difficulty |
|------|----------|--------|------------|
| Fix ChatInterface typos | 🔴 Critical | 5 min | Trivial |
| Extend AIService for tools | 🔴 Critical | 30 min | Easy |
| Create tool-calling handler | 🔴 Critical | 1.5 hr | Medium |
| Update chat controller response | 🔴 Critical | 15 min | Easy |
| Test tool-calling flow | 🔴 Critical | 2 hr | Medium |
| **Total Phase 1 Minimum** | | **~4 hours** | **Medium** |

---

## Next Steps

1. **Review this research** with the team
2. **Fix frontend bugs** (ChatInterface typos) - quick win
3. **Implement Claude tool calling** in AIService
4. **Create tool-calling handler** in ChatService
5. **Update response contracts** between backend and frontend
6. **End-to-end test** with Claude
7. **Deploy Phase 1** to staging

---

## Appendix: File Reference

### Backend Files to Modify
- `backend/src/modules/ai/ai.service.ts` - Add tool definitions & tool-calling invoke
- `backend/src/modules/chat/chat.service.ts` - Add tool-calling handler
- `backend/src/modules/chat/chat.controller.ts` - Fix response structure
- `backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts` - Add tool definition converter

### Frontend Files to Modify
- `src/components/ChatInterface.jsx` - Fix response parsing (2 typos)
- `src/components/ChatInterface.test.jsx` - Update tests for new response structure (optional)

### Files to Create
- `backend/src/modules/chat/handlers/tool-calling.handler.ts` - New tool-calling handler
- `backend/src/modules/ai/converters/tool-definition.converter.ts` - New tool definition converter

### Files That Are Complete ✅
- All tool implementations (sofa, drug-checker, lab-interpreter)
- Tool Orchestrator service & controller
- ChatInterface UI components (except for bugs)
- ToolCard rendering

---

**Research Complete** ✅  
**Ready for Phase 1 Implementation** 🚀
