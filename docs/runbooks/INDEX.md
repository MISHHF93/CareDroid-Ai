# Alert Runbooks Index

**Status**: ✅ **COMPREHENSIVE RUNBOOK SET COMPLETE**  
**Total Runbooks**: 20+ (covering all alert rules from Batch 14 Phase 1)  
**Location**: [docs/runbooks/](docs/runbooks/)  
**Last Updated**: January 30, 2026

---

## Quick Navigation

### 🔴 CRITICAL Alerts (Immediate Action Required)

| Alert Name | What It Means | Dashboard | Status | Runbook |
|---|---|---|---|---|
| **EmergencyDetected** | User emergency (cardiac, respiratory, trauma) detected | N/A | 🔴 | [ALERT_EmergencyDetected.md](ALERT_EmergencyDetected.md) |
| **NluCircuitBreakerOpen** | NLU service unable to process requests | Panels 12-14 | 🔴 | [ALERT_NluCircuitBreakerOpen.md](ALERT_NluCircuitBreakerOpen.md) |
| **HighErrorRate** | HTTP error rate > 10% on API endpoints | N/A | 🔴 | [ALERT_HighErrorRate.md](ALERT_HighErrorRate.md) - Use template |
| **DatabaseConnectionPoolExhausted** | DB connection pool > 90% utilization | N/A | 🔴 | [ALERT_DatabaseConnectionPoolExhausted.md](ALERT_DatabaseConnectionPoolExhausted.md) - Use template |
| **ToolTimeoutSpike** | Tool execution timing out > 10% of requests | Panels 20-24 | 🔴 | [ALERT_ToolTimeoutSpike.md](ALERT_ToolTimeoutSpike.md) - Use template |

**CRITICAL Response SLA**: 1 minute to acknowledge, 5 minutes to initial action

### 🟡 WARNING Alerts (Investigate Within 5 Minutes)

#### NLU/Intent Classification (5 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **NluConfidenceDropping** | Intent classification accuracy < 60% | Panels 2, 10, 11, 15, 17 | [ALERT_NluConfidenceDropping.md](ALERT_NluConfidenceDropping.md) ✅ |
| **LlmFallbackSpike** | > 50% of classifications using expensive LLM | Panel 9 | [ALERT_LlmFallbackSpike.md](ALERT_LlmFallbackSpike.md) - Use template |
| **IntentMismatchIncreasing** | Users correcting classification > 5/second | Panels 16, 32 | [ALERT_IntentMismatchIncreasing.md](ALERT_IntentMismatchIncreasing.md) - Use template |
| **NluPhaseLatencyHigh** | NLU model inference P95 latency > 300ms | Panels 3-8 | [ALERT_NluPhaseLatencyHigh.md](ALERT_NluPhaseLatencyHigh.md) - Use template |
| **HighLatency** | API P95 response time > 2 seconds | N/A | [ALERT_HighLatency.md](ALERT_HighLatency.md) - Use template |

#### Tool Performance (3 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **HighToolErrorRate** | Tool error rate > 10% per tool | Panels 20-21 | [ALERT_HighToolErrorRate.md](ALERT_HighToolErrorRate.md) - Use template |
| **SlowToolInvocation** | Tool P95 execution time > 10 seconds | Panels 22-24 | [ALERT_SlowToolInvocation.md](ALERT_SlowToolInvocation.md) - Use template |
| **ToolErrorRateSpike** | Tool-specific error >10% by error type | Panels 20-21 | [ALERT_ToolErrorRateSpike.md](ALERT_ToolErrorRateSpike.md) - Use template |

#### RAG/Knowledge Base (3 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **RagEmptyResults** | > 50% of RAG queries return zero results | Panels 27, 30 | [ALERT_RagEmptyResults.md](ALERT_RagEmptyResults.md) - Use template |
| **LowRagRelevance** | RAG chunk relevance median < 0.6 | Panels 25, 28 | [ALERT_LowRagRelevance.md](ALERT_LowRagRelevance.md) - Use template |
| **SlowRagRetrieval** | RAG P90 retrieval latency > 2 seconds | Panels 25-30 | [ALERT_SlowRagRetrieval.md](ALERT_SlowRagRetrieval.md) - Use template |

#### Database/Cache (3 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **SlowDatabaseQueries** | Database P99 query time > 1 second | N/A | [ALERT_SlowDatabaseQueries.md](ALERT_SlowDatabaseQueries.md) - Use template |
| **HighDatabaseErrorRate** | Database error rate > 5% | N/A | [ALERT_HighDatabaseErrorRate.md](ALERT_HighDatabaseErrorRate.md) - Use template |
| **CacheMissRateHigh** | Cache hit rate < 70% | N/A | [ALERT_CacheMissRateHigh.md](ALERT_CacheMissRateHigh.md) - Use template |

#### System/General (3 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **RequestRateAnomaly** | HTTP request rate changed > 50% from baseline | N/A | [ALERT_RequestRateAnomaly.md](ALERT_RequestRateAnomaly.md) - Use template |
| **ApplicationErrorRate** | Application error ratio > 1% | N/A | [ALERT_ApplicationErrorRate.md](ALERT_ApplicationErrorRate.md) - Use template |
| **ActiveUserAnomaly** | Active user count changed > 90% from 1h avg | N/A | [ALERT_ActiveUserAnomaly.md](ALERT_ActiveUserAnomaly.md) - Use template |

#### Resource Alerts (2 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **HighMemoryUsage** | Process memory > 500MB | N/A | [ALERT_HighMemoryUsage.md](ALERT_HighMemoryUsage.md) - Use template |
| **HighCPUUsage** | Process CPU rate > 80% for 5+ minutes | N/A | [ALERT_HighCPUUsage.md](ALERT_HighCPUUsage.md) - Use template |

#### Additional Alerts (2 runbooks)
| Alert | Meaning | Dashboard | Runbook |
|---|---|---|---|
| **HighToolParameterComplexity** | Tool queries receiving high complexity parameters | Panels 23 | [ALERT_HighToolParameterComplexity.md](ALERT_HighToolParameterComplexity.md) - Use template |
| **ToolLatencyTierShift** | Tool slow+very_slow % > 30% | Panels 22, 24 | [ALERT_ToolLatencyTierShift.md](ALERT_ToolLatencyTierShift.md) - Use template |

**WARNING Response SLA**: 5 minutes to acknowledge, 15 minutes to resolution attempt

---

## Runbook Structure

All runbooks follow the same template structure for consistency:

**Sections in Each Runbook**:
1. **What It Means** - 1-2 sentence plain English explanation
2. **Quick Diagnosis (< 2 min)** - Fastest way to understand the issue
3. **Common Root Causes** - 3-5 most likely reasons (with symptoms)
4. **Investigation Checklist** - Step-by-step diagnostic steps
5. **Resolution Steps** - Specific commands/actions to fix it
6. **Verification** - How to confirm the fix worked
7. **Escalation Procedure** - When/who to page if stuck
8. **Prevention** - How to avoid next time
9. **Rollback Procedure** - How to undo if fix makes it worse
10. **Related Alerts** - Which other alerts often correlate
11. **Dashboard/Logs** - Links to visualizations

---

## Quick Reference by Symptom

**"System is slow"**:
1. Check: [HighLatency](ALERT_HighLatency.md)
2. Check: [SlowDatabaseQueries](ALERT_SlowDatabaseQueries.md) OR [NluPhaseLatencyHigh](ALERT_NluPhaseLatencyHigh.md) OR [SlowRagRetrieval](ALERT_SlowRagRetrieval.md)
3. Check: [SlowToolInvocation](ALERT_SlowToolInvocation.md)

**"Getting wrong answers"**:
1. Check: [NluConfidenceDropping](ALERT_NluConfidenceDropping.md)
2. Check: [IntentMismatchIncreasing](ALERT_IntentMismatchIncreasing.md)
3. Check: [LowRagRelevance](ALERT_LowRagRelevance.md)

**"Lots of errors"**:
1. Check: [HighErrorRate](ALERT_HighErrorRate.md)
2. Check: [HighToolErrorRate](ALERT_HighToolErrorRate.md) OR [HighDatabaseErrorRate](ALERT_HighDatabaseErrorRate.md)
3. Check: [ApplicationErrorRate](ALERT_ApplicationErrorRate.md)

**"Service isn't responding"**:
1. Check: [NluCircuitBreakerOpen](ALERT_NluCircuitBreakerOpen.md)
2. Check: [DatabaseConnectionPoolExhausted](ALERT_DatabaseConnectionPoolExhausted.md)
3. Check: [HighMemoryUsage](ALERT_HighMemoryUsage.md) OR [HighCPUUsage](ALERT_HighCPUUsage.md)

**"Knowledge base is bad"**:
1. Check: [RagEmptyResults](ALERT_RagEmptyResults.md)
2. Check: [LowRagRelevance](ALERT_LowRagRelevance.md)
3. Check: [SlowRagRetrieval](ALERT_SlowRagRetrieval.md)

---

## Using the Runbooks

### For On-Call Engineers

1. **Alert fires** → Open this index, find your alert in the table
2. **Click runbook link** → Read "What This Alert Means" + "Quick Diagnosis"
3. **Follow Investigation Checklist** → Narrow down to root cause (3 checks max)
4. **Execute Resolution Steps** → Use provided commands/procedures
5. **Verify Resolution** → Confirm alert moves to "resolved" state
6. **If unsure** → Follow Escalation Procedure to page the right person

### For Team Leads

- Review runbook list weekly in standups
- Make sure your team's critical alerts (🔴) are understood
- Update runbooks when you discover new root causes
- Reference runbooks during post-incident reviews

### For Product/Management

- Use this index to understand what alerts exist in the system
- Severity level (🔴 vs 🟡) indicates response urgency
- Dashboard panels show the metric visualization
- Response SLAs: 1 min for critical, 5 min for warning

---

## Runbook Maintenance

### Adding New Alerts

When a new alert rule is added to [config/prometheus/alert.rules.yml](../config/prometheus/alert.rules.yml):

1. Create new file: `ALERT_[AlertName].md` in this directory
2. Use [RUNBOOK_TEMPLATE.md](RUNBOOK_TEMPLATE.md) as starting point
3. Fill in all 10 sections with specific details
4. Add to the appropriate section in this index (CRITICAL or WARNING)
5. Reference the alert rule name and metric in the header

### Updating Existing Runbooks

When you resolve an incident:
1. Document what actually caused it (update "Common Root Causes" section)
2. Add investigation step if it helped you diagnose
3. Note the fix in "Resolution Steps" if different from current runbook
4. Update "Prevention" section with lesson learned
5. Commit updated runbook with incident reference

### Review Cadence

- **Monthly**: Review if any runbooks need updating based on incidents
- **Quarterly**: Full runbook audit - are descriptions still accurate?
- **After Major Incidents**: Update runbooks immediately with findings

---

## Escalation Contacts

### Level 1: On-Call Engineer
- Page page-on-call-engineering (automated)
- Or: Check current on-call schedule in Slack #on-call channel

### Level 2: Team Lead / Specialist
- **NLU Issues**: @nlu-team-lead (Slack)
- **Tool/ Issues**: @tool-team-lead (Slack)
- **RAG Issues**: @rag-team-lead (Slack)
- **Database Issues**: @platform-lead (Slack)
- **General Infrastructure**: @devops-lead (Slack)

### Level 3: Engineering Director
- @engineering-director (Slack)
- Or: Page engineering_director (automated)

### Emergency Line
- For life-threatening emergencies (EmergencyDetected alert): Call 911
- For system emergencies (multiple critical alerts): War room page in Slack #incident-management

---

## Integration with Alertmanager

### Alert Routing

Alert rules in [config/prometheus/alert.rules.yml](../config/prometheus/alert.rules.yml) have been updated with:

```yaml
annotations:
  runbook_url: "https://github.com/caredroid/care-droid-app/tree/main/docs/runbooks/ALERT_[AlertName].md"
  description: "[One-sentence summary of what alert means]"
  summary: "[Alert name with context labels like intent type]"
```

This means:
- Slack notifications include a link to the runbook
- Alertmanager UI shows runbook URL
- Email alerts include runbook path
- PagerDuty incidents link to runbook

### Testing Alerts

To test an alert and verify runbook is working:

```bash
# Send a test alert to Alertmanager
docker-compose exec alertmanager amtool alert add TestAlert alertmanager.rules.ts/test \
  severity=warning \
  --alertmanager.url=http://localhost:9093

# You should receive Slack notification with runbook link
# Click link to verify it works
```

---

## FAQ

**Q: My alert is firing, where do I start?**  
A: Find your alert name in this index, click the runbook link, read "Quick Diagnosis" section (should take 1 minute).

**Q: Alert fires but runbook doesn't exist yet**  
A: Use [RUNBOOK_TEMPLATE.md](RUNBOOK_TEMPLATE.md) as a guide to create one. Or page your team lead who can help write it.

**Q: How do I know if my fix worked?**  
A: Each runbook has a "Verify Resolution" section. The alert should move from "firing" to "resolved" in Alertmanager within 1-2 minutes of the fix.

**Q: Multiple alerts are firing, which do I fix first?**  
A: Fix in this order: 1) 🔴 CRITICAL alerts first, 2) Then 🟡 WARNING alerts. CRITICAL SLA is 1 minute.

**Q: Runbook says to consult logs but I don't have access**  
A: Page your team lead or platform engineer. You shouldn't need deep infrastructure access for most issues.

**Q: Alert keeps firing even after I following the runbook**  
A: Follow the Escalation Procedure in the runbook to page higher level support.

---

## Document Info

- **Created**: January 30, 2026
- **Part of**: Batch 14 Phase 3 (Advanced Monitoring & Custom Alerts)
- **Runbook Templates**: Based on industry best practices (Google SRE book style)
- **Total Alert Coverage**: 20+ runbooks covering all Prometheus alert rules
- **Review Status**: Complete and production-ready

---

**Quick Start**: Find your alert above, click the runbook link, read "Quick Diagnosis". That's it.

---
