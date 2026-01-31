# Batch 15 Planning Summary: Clinical Co-Pilot MVP

**Date**: January 30, 2026  
**Status**: Recommended Next Focus Area  
**Duration**: 2-3 weeks (140-210 hours)  
**Team Size**: 2 developers

---

## What's Done (Batches 1-14)

✅ Chat interface, authentication, 17 clinical tools  
✅ Intent classifier (keyword + LLM)  
✅ RAG engine (ready for data)  
✅ Monitoring stack (14 metrics, 27 alerts, Grafana)  
✅ Cost tracking & anomaly detection  

## What's Blocking Users (Batch 15)

**PROBLEM**: Users can identify they need SOFA score, but can't execute it in chat.

### 3 Critical Gaps:

1. **Tool Orchestrator** (1 week)
   - Execute clinical tools (API calls)
   - Format results as ToolCard in chat
   - Validate parameters, handle errors
   - **Blocker**: Can't use any clinical tool

2. **Emergency Detection & Escalation** (1 week)
   - Notify user immediately on life-threatening keywords
   - Insert crisis resources (hotlines, protocols)
   - Log escalation events
   - **Blocker**: System can't respond to emergencies

3. **RBAC Enforcement** (5-7 days)
   - Viewer role cannot see PHI
   - Clinician cannot manage users
   - Audit log all permission denials
   - **Blocker**: Can't deploy multi-user (compliance risk)

---

## Why Batch 15 First?

### Impact Ranking

| Feature | User Impact | Business Value | Risk |
|---------|---|---|---|
| **Tool Orchestrator** | 🔴 Blocks core feature | MVP differentiator | Low |
| **Emergency Detection** | 🔴 Life-safety critical | Marketing + compliance | Medium |
| **RBAC** | 🟠 Enterprise requirement | Hospital deployments | Low |
| **RAG KB** (Batch 16) | 🟡 Improves accuracy | AI quality | Medium |
| **HIPAA Docs** (Batch 18) | 🟡 Legal requirement | Audit readiness | Low |

**Verdict**: Batch 15 unblocks product; batches 16-18 follow.

---

## Batch 15 Detailed Plan

### Phase 1: Tool Orchestrator (Week 1)

**Files**:
- `backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts` (NEW)
  - `executeInChat(toolId, params, context)` method
  - Tool execution with parameter validation
  - Result formatting for chat presentation
- `src/components/ToolCard.jsx` (NEW)
  - Display tool results (score, interpretation, errors)
  - Show citations with links
  - Styling (border, background, warnings)
- `src/components/ChatInterface.jsx` (MODIFY)
  - Detect `message.type === 'tool_result'`
  - Render ToolCard instead of plain text

**Acceptance Criteria**:
```
Given: User types "Calculate SOFA score with PaO2/FiO2 180"
Then:
  - Within 500ms, ToolCard appears with input form
  - User enters additional values (platelets, MAP, etc.)
  - Tool executes and returns score with interpretation
  - Citations appear (e.g., "Vincent JL et al. 1996")
```

**Testing**:
- Unit: SOFA calculation accuracy
- Integration: Chat → Tool execution → Card rendering
- Performance: <500ms end-to-end

---

### Phase 2: Emergency Detection & Escalation (Week 2)

**Files**:
- `backend/src/modules/emergency/emergency-escalator.service.ts` (NEW)
  - `escalate(alert, context)` method
  - Send notifications, log events, insert resources
- `backend/src/modules/emergency/data/crisis-resources.ts` (NEW)
  - Hotlines (suicide, crisis texting, poison control)
  - Protocols (ACLS, stroke alert, rapid response)
- `src/components/EmergencyBanner.jsx` (NEW)
  - Red background, pulsing animation
  - "Call 911", "Page Rapid Response", "False Alarm" buttons
- `src/components/ChatInterface.jsx` (MODIFY)
  - Check for emergency alerts before rendering
  - Auto-display banner on detected emergency

**Acceptance Criteria**:
```
Given: User types "Patient has no pulse"
Then:
  - Within 100ms: Red emergency banner appears
  - Message: "🚨 CRITICAL: Cardiac arrest detected"
  - Action buttons: "Call 911" | "Page Rapid Response" | "False Alarm"
  - Crisis resources auto-inserted: CPR steps, ACLS protocol link
  - Button click logs action (escalated vs false alarm)
  
Given: User dismisses with "False Alarm"
Then:
  - Audit log shows: emergency_detected=true, user_action=dismissed
  - System doesn't re-alert for same keyword in next 5 min
```

**Testing**:
- 100% recall on critical keywords (cardiac arrest, stroke, suicide, etc.)
- <5% false positive rate
- <100ms detection latency
- False alarm handling verified

---

### Phase 3: RBAC Enforcement (Week 2 Afternoon)

**Files**:
- `backend/src/modules/auth/enums/permission.enum.ts` (NEW)
  - 8 permissions: READ_PHI, WRITE_PHI, EXPORT_PHI, MANAGE_USERS, VIEW_AUDIT_LOGS, etc.
- `backend/src/modules/auth/guards/authorization.guard.ts` (NEW)
  - `@RequirePermission(Permission.READ_PHI)` decorator
  - Check user role against permission in token
- Backend endpoints (MODIFY):
  - `GET /api/chat/conversations` → `@RequirePermission(Permission.READ_PHI)`
  - `POST /api/users` → `@RequirePermission(Permission.MANAGE_USERS)`
  - `GET /api/audit/logs` → `@RequirePermission(Permission.VIEW_AUDIT_LOGS)`
- `src/components/PermissionGate.jsx` (NEW)
  - Frontend wrapper: `<PermissionGate permission="manage_users">...</PermissionGate>`
- `src/App.jsx` (MODIFY)
  - Hide "Audit Logs" link for non-admin users

**Acceptance Criteria**:
```
Given: Viewer role user
Then:
  - Cannot access /chat (redirects to read-only mode)
  - Cannot see /audit-logs
  - Cannot see /admin/users
  - API returns 403 Forbidden if accessing protected endpoints

Given: Clinician role user
Then:
  - Can access chat and execute tools
  - Cannot access /admin/users or /audit-logs
  - API allows tool execution but rejects user management

Given: Permission denial
Then:
  - Audit log records: action=permission_denied, permission=MANAGE_USERS, user_role=clinician
```

**Testing**:
- Each role has correct permissions (8 test cases × 4 roles)
- Audit log records all denials
- Frontend hides/shows features correctly

---

## Batch 15 Work Breakdown

| Task | Time | Developer |
|------|------|-----------|
| **Phase 1: Tool Orchestrator** | | |
| Tool execution service | 3 days | Dev 1 |
| ToolCard UI component | 2 days | Dev 2 |
| Chat integration & testing | 2 days | Dev 1 |
| **Phase 2: Emergency Detection** | | |
| Emergency escalator service | 2 days | Dev 1 |
| Crisis resources database | 1 day | Dev 2 |
| EmergencyBanner component | 2 days | Dev 2 |
| Chat integration & testing | 2 days | Dev 1 |
| **Phase 3: RBAC** | | |
| Permission enum & guards | 2 days | Dev 1 |
| Endpoint authorization | 2 days | Dev 1 |
| Frontend PermissionGate | 1 day | Dev 2 |
| Testing & audit logging | 2 days | Dev 1 |
| **Integration & Documentation** | | |
| End-to-end testing | 2 days | Both |
| Documentation & PRs | 2 days | Both |
| **Total** | ~26 days (21 working days) | 2 devs |

---

## Success Metrics (Go/No-Go Criteria)

### Must-Have (Release Blockers)
- [ ] All 17 clinical tools executable in chat
- [ ] Emergency detection 100% recall, <5% false positive
- [ ] RBAC enforced on all endpoints
- [ ] Latency SLOs: tool <500ms, emergency <100ms
- [ ] Zero security regressions (all auth tests pass)
- [ ] >90% test coverage for new code

### Nice-to-Have
- [ ] Admin role-assignment UI
- [ ] User training materials for RBAC
- [ ] Advanced error handling for tool failures
- [ ] Performance optimization for tool execution

---

## Timeline & Milestones

| Week | Milestone | Owner |
|------|-----------|-------|
| Week 1 | Phase 1 complete (Tool Orchestrator) | Dev 1 |
| Week 1-2 | Phase 2 & 3 in parallel (Emergency, RBAC) | Dev 1 + 2 |
| Week 2-3 | Integration testing & bugfixes | Both |
| Week 3 | Code review & merge to main | Both |
| Week 3-4 | Deploy to staging & production | DevOps |

**Target Completion**: Mid-February 2026

---

## Next Batches (After Batch 15)

### Batch 16: RAG Knowledge Base (2-3 weeks)
- Curate medical corpus (ACLS, sepsis, FDA drugs)
- Ingest documents into Pinecone
- Validate retrieval quality
- Integrate with chat (cite sources)

### Batch 17: Advanced Features (2-3 weeks)
- Fine-tune BERT for NLU (Phase 2)
- Implement MFA/2FA setup
- Reduce LLM fallback usage

### Batch 18: HIPAA Hardening (2-3 weeks)
- Immutable audit logs (hashing)
- Database encryption
- Compliance documentation
- Security audit

---

## Known Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Emergency false positives annoy users | High | User feedback loop; adjust keyword thresholds in Batch 16 |
| Tool parameter validation complex | Medium | Use strong typing; extensive unit tests |
| RBAC bugs enable unauthorized access | Critical | Third-party code review; security audit |
| Performance degrades with many tools | Medium | Caching layer; async tool execution |

---

## Decision Point

**Proceed with Batch 15?**

- ✅ **YES** - Unblock product; enables pilot deployments
- ⏸️ **PAUSE** - Need more time for compliance (do Batch 18 first)
- ❌ **NO** - Focus elsewhere (specify)

**Recommendation**: ✅ **YES** - Start Batch 15 immediately to demonstrate clinical value by mid-February.

---

**Prepared by**: Research & Planning  
**Date**: January 30, 2026
