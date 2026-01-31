# Phase 1 Implementation Quick Start

**Status**: Research Complete ✅  
**Date**: January 30, 2026  
**Document**: Quick reference for Tool Orchestrator integration with Claude

---

## 🎯 Phase 1 Goal
Enable Claude to **call clinical tools directly** using OpenAI's `tool_use` feature, replacing the current intent-classification-based routing.

---

## The 4 Critical Changes

### 1️⃣ Fix Frontend Bugs (5 min) 🟢
**File**: `src/components/ChatInterface.jsx` (Lines 78-101)

**Current Code** (BROKEN):
```javascript
const assistantMessage = {
  role: 'assistant',
  content: data.respons,  // TYPO: should be response
  citations: data.citations || [],
  confidence: data.confidence,
  ragContext: data.ragContext,e || 'I encountered an error processing your request.',  // SYNTAX ERROR
  timestamp: new Date()
};
```

**Fixed Code**:
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

### 2️⃣ Extend AIService with Tool Definitions (30 min) 🟡
**File**: `backend/src/modules/ai/ai.service.ts`

**Add to AIService class**:

```typescript
// Convert tool definitions to Claude format
private getToolDefinitionsForClaude(): any[] {
  const tools = this.toolOrchestrator.listAvailableTools().tools;
  
  return tools.map(tool => ({
    type: "function",
    function: {
      name: tool.id.replace(/-/g, '_'),  // sofa-calculator → sofa_calculator
      description: tool.description,
      input_schema: {
        type: "object",
        properties: this.buildProperties(tool.parameters),
        required: tool.parameters
          .filter(p => p.required)
          .map(p => p.name)
      }
    }
  }));
}

// Build JSON Schema properties from tool parameters
private buildProperties(parameters: any[]): Record<string, any> {
  const props: Record<string, any> = {};
  
  for (const param of parameters) {
    props[param.name] = {
      type: param.type === 'object' ? 'object' : 
            param.type === 'array' ? 'array' : param.type,
      description: param.description,
      ...(param.validation?.min !== undefined && { minimum: param.validation.min }),
      ...(param.validation?.max !== undefined && { maximum: param.validation.max }),
      ...(param.validation?.options && { enum: param.validation.options }),
    };
  }
  
  return props;
}

// New method: invoke LLM with tools
async invokeLLMWithTools(
  userId: string,
  prompt: string,
  context?: any
): Promise<{
  content: string,
  toolCalls?: Array<{ id: string, name: string, input: Record<string, any> }>,
  model: string,
  tokensUsed: number,
  finishReason: string
}> {
  if (!this.openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  const subscription = await this.subscriptionRepository.findOne({
    where: { userId },
    order: { createdAt: 'DESC' },
  });
  
  const tier = subscription?.tier || SubscriptionTier.FREE;
  const config = this.rateLimits.get(tier);
  
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are CareDroid, a clinical decision support AI. You have access to clinical tools for calculations, drug interactions, and lab interpretation. Use tools when appropriate to provide accurate clinical information.`,
      },
      { role: "user", content: prompt }
    ];
    
    if (context) {
      messages.push({
        role: "system",
        content: `Context: ${JSON.stringify(context)}`,
      });
    }
    
    // Get tool definitions
    const tools = this.getToolDefinitionsForClaude();
    
    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
      max_tokens: config.maxTokens,
      temperature: 0.7,
    });
    
    // Parse tool calls from response
    const toolCalls: Array<{ id: string, name: string, input: any }> = [];
    let responseText = '';
    
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, any>
        });
      }
    }
    
    return {
      content: responseText,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: config.model,
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: response.choices[0].finish_reason || 'stop',
    };
  } catch (error) {
    throw new Error(`Tool-calling LLM query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

---

### 3️⃣ Create Tool-Calling Handler in ChatService (1.5 hours) 🟠
**File**: `backend/src/modules/chat/chat.service.ts`

**Add new method to ChatService class**:

```typescript
/**
 * Process message with Claude tool calling
 * Main entry point for Phase 1 implementation
 */
async processMessageWithToolCalling(
  message: string,
  userId: string,
  conversationId?: number
): Promise<QueryResponse> {
  this.logger.log(`💬 Processing with tool calling: "${message.substring(0, 50)}..."`);
  
  try {
    // ========================================
    // STEP 1: INVOKE CLAUDE WITH TOOLS
    // ========================================
    const aiResponse = await this.aiService.invokeLLMWithTools(
      userId || 'anonymous',
      message,
      { conversationId }
    );
    
    this.logger.log(
      `🤖 Claude response: tool_calls=${aiResponse.toolCalls?.length || 0}, tokens=${aiResponse.tokensUsed}`
    );
    
    // ========================================
    // STEP 2: EXECUTE TOOL CALLS (IF ANY)
    // ========================================
    let toolResults: any[] = [];
    
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      toolResults = await Promise.all(
        aiResponse.toolCalls.map(call =>
          this.executeTool(call, userId, conversationId)
        )
      );
      
      this.logger.log(`✅ Executed ${toolResults.length} tools`);
    }
    
    // ========================================
    // STEP 3: BUILD RESPONSE
    // ========================================
    let finalText = aiResponse.content;
    
    // If tools were executed, add tool result summary to response
    if (toolResults.length > 0) {
      // Claude has already mentioned what tools it's using
      // Tool results are displayed separately in the UI
      this.logger.log(`Tool results: ${toolResults.map(t => t.toolId).join(', ')}`);
    }
    
    // Record usage
    if (userId) {
      await this.auditService.log({
        userId,
        action: AuditAction.AI_QUERY,
        resource: 'chat/tool-calling',
        details: {
          message: message.substring(0, 100),
          toolsExecuted: toolResults.length,
          tokensUsed: aiResponse.tokensUsed,
          finishReason: aiResponse.finishReason,
        },
        ipAddress: '0.0.0.0',
        userAgent: 'system',
      });
    }
    
    return {
      text: finalText,
      toolResult: toolResults.length > 0 ? toolResults[0] : undefined,
      suggestions: toolResults.length > 0 
        ? ['Execute again', 'View details', 'Export results']
        : ['More information', 'Related topics'],
    };
    
  } catch (error) {
    this.logger.error(`Tool-calling failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      text: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestions: ['Try rephrasing', 'Contact support'],
    };
  }
}

/**
 * Execute a single tool call from Claude
 */
private async executeTool(
  toolCall: { id: string, name: string, input: Record<string, any> },
  userId: string,
  conversationId?: number
): Promise<any> {
  // Convert tool name from Claude format (sofa_calculator) to stored format (sofa-calculator)
  const toolId = toolCall.name.replace(/_/g, '-');
  
  this.logger.log(`🔧 Executing tool: ${toolId} (call_id: ${toolCall.id})`);
  
  try {
    const result = await this.toolOrchestrator.executeInChat(
      toolId,
      toolCall.input,
      userId,
      `chat-${conversationId || Date.now()}`
    );
    
    return {
      toolCallId: toolCall.id,
      toolId: toolId,
      toolName: result.toolName,
      success: true,
      result: result.result,
      formattedForChat: result.formattedForChat,
    };
  } catch (error) {
    this.logger.error(`Tool execution failed: ${toolId}`, error);
    
    return {
      toolCallId: toolCall.id,
      toolId: toolId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

### 4️⃣ Update Chat Controller Response (15 min) 🟡
**File**: `backend/src/modules/chat/chat.controller.ts`

**Update the sendMessage endpoint**:

```typescript
@Post('message')
@RequirePermission(Permission.USE_AI_CHAT)
async sendMessage(@Body() dto: ChatMessageDto, @Req() req?: any): Promise<any> {
  const userId = req?.user?.id || 'anonymous';
  
  // Route to tool-calling handler
  const response = await this.chatService.processMessageWithToolCalling(
    dto.message,
    userId,
    dto.conversationId
  );
  
  // Return flattened response structure (not nested in metadata)
  return {
    response: response.text,
    citations: response.citations || [],
    confidence: response.confidence,
    ragContext: response.ragContext,
    toolResult: response.toolResult,
    suggestions: response.suggestions,
    timestamp: Date.now(),
  };
}
```

---

## 🔨 Implementation Checklist

- [ ] **Fix ChatInterface bugs** (5 min)
  - [ ] Line 86: Fix `data.respons` typo
  - [ ] Line 91: Fix syntax error in ragContext line

- [ ] **Extend AIService** (30 min)
  - [ ] Add `getToolDefinitionsForClaude()` method
  - [ ] Add `buildProperties()` method
  - [ ] Add `invokeLLMWithTools()` method
  - [ ] Inject ToolOrchestratorService into AIService

- [ ] **Create Tool-Calling Handler** (1.5 hours)
  - [ ] Add `processMessageWithToolCalling()` to ChatService
  - [ ] Add `executeTool()` private method
  - [ ] Handle Claude's tool_use blocks
  - [ ] Parse tool call names (underscore ↔ hyphen)
  - [ ] Execute tools concurrently

- [ ] **Update Chat Controller** (15 min)
  - [ ] Change `sendMessage()` to call tool-calling handler
  - [ ] Update response structure
  - [ ] Remove nested metadata structure

- [ ] **Test End-to-End** (1-2 hours)
  - [ ] Test basic Claude query (no tools)
  - [ ] Test tool-calling with SOFA calculator
  - [ ] Test tool-calling with drug checker
  - [ ] Test multiple tool calls
  - [ ] Test error scenarios

**Total Time**: ~4 hours

---

## 🚀 Running Phase 1 Tests

### Test 1: Basic Claude Query (No Tools)
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "What are the stages of sepsis?",
    "conversationId": 1
  }'

# Expected: Claude response about sepsis, no tools
```

### Test 2: SOFA Calculator via Claude
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Calculate SOFA score for: PaO2/FiO2 180, platelets 90, bilirubin 2.4, MAP 62, GCS 12, creatinine 1.9",
    "conversationId": 1
  }'

# Expected: 
# 1. Claude recognizes this needs sofa_calculator
# 2. Claude calls tool with extracted parameters
# 3. Tool executes and returns score (totalScore: 8)
# 4. Claude synthesizes response with score interpretation
```

### Test 3: Drug Checker via Claude
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Check interactions between warfarin and ibuprofen",
    "conversationId": 1
  }'

# Expected:
# 1. Claude calls drug-interactions tool
# 2. Returns major interaction warning
# 3. Claude explains the interaction
```

---

## 📊 Success Criteria for Phase 1

- ✅ Claude can see available tools
- ✅ Claude correctly identifies when a tool should be used
- ✅ Claude correctly extracts parameters from user message
- ✅ Tool execution succeeds and returns results
- ✅ Claude synthesizes final response using tool results
- ✅ Frontend correctly displays tool results and Claude response
- ✅ No data loss or errors in multi-tool scenarios
- ✅ Audit logging captures tool usage

---

## 🔗 Map of Key Files

### Tools (Already Complete ✅)
```
backend/src/modules/medical-control-plane/tool-orchestrator/
├── tool-orchestrator.service.ts       (Main service - READY)
├── tool-orchestrator.controller.ts    (API endpoints - READY)
├── services/
│   ├── sofa-calculator.service.ts     (SOFA tool - READY)
│   ├── drug-checker.service.ts        (Drug tool - READY)
│   └── lab-interpreter.service.ts     (Lab tool - READY)
├── interfaces/
│   └── clinical-tool.interface.ts     (Tool contract - READY)
└── dto/
    └── tool-execution.dto.ts          (API contracts - READY)
```

### Chat (Modify for Phase 1 ⚠️)
```
backend/src/modules/chat/
├── chat.service.ts                    (ADD processMessageWithToolCalling)
├── chat.controller.ts                 (UPDATE sendMessage response)
└── chat.module.ts                     (No changes needed)
```

### AI (Extend for Phase 1 ⚠️)
```
backend/src/modules/ai/
├── ai.service.ts                      (ADD invokeLLMWithTools)
├── ai.controller.ts                   (No changes needed)
└── ai.module.ts                       (No changes needed)
```

### Frontend (Fix bugs + test ⚠️)
```
src/components/
├── ChatInterface.jsx                  (FIX typos in response parsing)
├── ToolCard.jsx                       (No changes needed)
└── ToolPanel.jsx                      (No changes needed)
```

---

## 🎓 Key Concepts

### Claude Tool Calling
Claude's `tool_use` blocks look like:
```json
{
  "type": "tool_use",
  "id": "sofa_001",
  "name": "sofa_calculator",
  "input": {
    "pao2": 180,
    "fio2": 0.4,
    "platelets": 90,
    "bilirubin": 2.4,
    "map": 62,
    "gcs": 12,
    "creatinine": 1.9
  }
}
```

### Tool Definition Format
Claude expects tools in this format:
```json
{
  "type": "function",
  "function": {
    "name": "sofa_calculator",
    "description": "Sequential Organ Failure Assessment...",
    "input_schema": {
      "type": "object",
      "properties": {
        "pao2": { "type": "number", "description": "...", "minimum": 0, "maximum": 700 }
      },
      "required": ["pao2"]
    }
  }
}
```

### Tool ID Conversion
Care-Droid uses hyphens, Claude uses underscores:
- Stored: `sofa-calculator`
- Claude: `sofa_calculator`
- Conversion: Use `.replace(/-/g, '_')` and `.replace(/_/g, '-')`

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't forget the systemPrompt** - Tell Claude what tools are available
2. **Don't mix tool formats** - Hyphen vs underscore mismatches will break it
3. **Don't skip tool validation** - Validate parameters before execution
4. **Don't ignore tool result format** - Claude expects JSON string results
5. **Don't forget error handling** - Tool failures need graceful recovery
6. **Don't overload Claude** - Keep conversation context reasonable

---

**Ready to implement?** Start with item #1 (fix frontend bugs) - it's a quick win! 🎯
