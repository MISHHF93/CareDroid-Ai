# Escalation Procedures & On-Call Guide

**Document Version**: 1.0  
**Created**: January 30, 2026  
**Part of**: Batch 14 Phase 3 (Advanced Monitoring & Custom Alerts)

---

## Alert Severity Levels & Response SLAs

### 🔴 CRITICAL Alerts
**Response SLA**: Acknowledge within 1 minute, Initial action within 5 minutes

| Alert Category | Who Gets Paged | First Response | Escalation Path | Decision Timeout |
|---|---|---|---|---|
| **Life Safety** | 911 + MD on-call | Immediate | Medical director → Hospital | N/A |
| **Service Down** | On-call engineer | 1 min | Platform lead → Director | 5 min |
| **Data Loss Risk** | On-call engineer | 1 min | Database lead → Director | 5 min |
| **Security Breach** | On-call engineer | 1 min | Security lead → CTO | 5 min |

### 🟡 WARNING Alerts
**Response SLA**: Acknowledge within 5 minutes, Resolution attempt within 15 minutes

| Alert Category | Who Gets Notified | First Response | Escalation Path | Decision Timeout |
|---|---|---|---|---|
| **NLU/Intent** | Slack #alerts-warnings | 5 min | NLU lead → Engineering lead | 15 min |
| **Tool Performance** | Slack #alerts-warnings | 5 min | Tool lead → Engineering lead | 15 min |
| **RAG/Knowledge** | Slack #alerts-warnings | 5 min | RAG lead → Engineering lead | 15 min |
| **Database/Cache** | Slack #alerts-warnings | 5 min | Platform lead → Engineering lead | 15 min |
| **API/General** | Slack #alerts-warnings | 5 min | Product lead → Engineering lead | 15 min |

---

## Primary On-Call Rotation

### Engineering On-Call (24/7)
**Responsibilities**: First response to all CRITICAL and WARNING alerts

| Role | Primary | Backup | Escalation |
|---|---|---|---|
| **On-Call Engineer** | [See Slack #on-call-schedule] | [See rotation] | Engineering Lead |

**Contact Methods** (in order):
1. PagerDuty alert (automated)
2. Slack DM in #on-call
3. Phone call (number in PagerDuty)
4. SMS (last resort)

### Specialty On-Call Contacts

**NLU Team Lead** (for `NluConfidenceDropping`, `LlmFallbackSpike`, `IntentMismatchIncreasing`)
- Slack: @nlu-team-lead
- Page: page-nlu-lead (PagerDuty)
- Estimated response: 5-10 minutes

**Tool/RAG Team Lead** (for tool and RAG alerts)
- Slack: @tool-team-lead
- Page: page-tool-lead (PagerDuty)
- Estimated response: 5-10 minutes

**Platform/Infrastructure Lead** (for database, cache, system)
- Slack: @platform-lead
- Page: page-platform-lead (PagerDuty)
- Estimated response: 5-10 minutes

**Engineering Lead** (for escalations, policy decisions)
- Slack: @engineering-lead
- Page: page-engineering-lead (PagerDuty) 
- Estimated response: 10-15 minutes

**Director on Duty** (for company-wide incidents, customer impact)
- Slack: @cto or @vp-engineering
- Page: page-director (PagerDuty) - triggers both
- Estimated response: Immediate (in office hours) / 15-30 min (emergency hours)

---

## Escalation Decision Tree

### 1. Alert Fires

**Is it CRITICAL (🔴)?**

**YES** → Go to Step 2

**NO** (WARNING) → Go to Step 3

### 2. CRITICAL Alert Escalation

```
Time 0:00 → Alert fires
           → PagerDuty pages On-Call Engineer (automatic)
           → Slack notification to #alerts-critical (automatic)

Time 0:30 → On-Call Engineer investigates (30 seconds allowed)

Time 1:00 → Decision: Can you fix it? 
           → YES: Execute fix, monitor for 3-5 minutes
           → NO: Page specialty team (see table above)

Time 1:30 → If specialty team pages:
           → Escalate to Engineering Lead automatically

Time 5:00 → If still not resolved:
           → Engineering Lead may:
              - Declare P1 incident (war room)
              - Activate incident commander
              - Notify VP Engineering
              - Consider customer communication

Time 15:00 → If still critical:
            → Director makes decision on service degradation
            → May temporarily disable features to stabilize
```

### 3. WARNING Alert Escalation

```
Time 0:00 → Alert fires
           → Slack notification to #alerts-warnings (automatic)
           → **No automatic page sent** (human monitors)

Time 0:05 → On-call engineer or relevant team member sees Slack
           → Acknowledges alert: React with 👀 emoji

Time 5:00 → Investigation started
           → Assignee: Most relevant team (NLU/Tool/Platform)

Time 10:00 → If unable to diagnose:
            → @mention team lead in the Slack thread
            → Team lead has 5 minutes to respond

Time 15:00 → If still unresolved:
            → Escalate to Engineering Lead
            → Formal escalation initiated
```

---

## Alert-Specific Escalation Paths

### 🔴 EmergencyDetected
```
Paging:
  1. 911 (external emergency services)
  2. On-call medical director (PagerDuty)
  3. VP Engineering (notification)

Investigation:
  - Confirm emergency is real (not sensor error)
  - Verify patient is receiving care
  - Follow medical protocols (not tech runbook!)

Escalation:
  - If emergency real: Follow medical protocols, don't escalate
  - If false positive: Medical director + Platform lead assess
  - If sensor failure: Head of biodevices for replacement
```

### 🔴 NluCircuitBreakerOpen
```
Paging:
  1. On-call engineer (immediate)
  2. NLU lead if engineer can't fix in 3 minutes
  3. Engineering lead if still open after 5 min

Investigation:
  1. Restart NLU service
  2. Check external dependencies (LLM API, Redis)
  3. Check logs for repeated errors

Escalation path:
  On-call → NLU lead → Engineering lead → Director (final fallback)
```

### 🔴 HighErrorRate
```
Paging:
  1. On-call engineer (immediate)
  2. If affecting users: Also page Engineering lead
  3. VP Engineering if estimated cost of incident > $5K

Investigation:
  1. Check recent deployments
  2. Restart backend service
  3. Check database connectivity

Escalation path:
  On-call → (Product lead if user impact) → Engineering lead → Director
```

### 🟡 NluConfidenceDropping
```
Notification:
  - Slack #alerts-warnings (automatic)
  - No page sent by default

Investigation:
  - NLU team member or on-call engineer
  - Check Panel 15 in dashboard
  - Follow runbook

Escalation:
  - If not resolved in 15 min: @nlu-team-lead
  - If not resolved in 30 min: @engineering-lead
  - NEVER page if confidence just slightly below 0.6
    (false alarm rate: 20%)
```

### 🟡 LlmFallbackSpike
```
Notification:
  - Slack #alerts-warnings (automatic)
  - Also post in #cost-control (cost implications)

Investigation:
  - Any engineer can investigate
  - Check NLU health first (likely cause)
  - Follow runbook

Escalation:
  - If affecting > 100 requests/min: @engineering-lead
  - If cumulative cost > $500: Also notify CFO (cost governance)
  - If lasting > 2 hours: Possible design flaw → architect review
```

---

## Incident Commander Rotation

When a CRITICAL alert escalates to "war room mode":

**Incident Commander** manages the incident:
- Owns the incident timeline
- Coordinates between teams
- Makes escalation decisions
- Communicates with leadership
- Schedules post-incident review

**Rotation** (monthly):
- Week 1: Engineering lead
- Week 2: NLU tech lead
- Week 3: Platform tech lead
- Week 4: Product lead

---

## Communication Templates

### When Escalating from On-Call to Team Lead

```
@nlu-team-lead - Alert: NluConfidenceDropping

Status: FIRING for 7 minutes
Metric: nlu_confidence_scores avg = 0.52 (threshold: 0.6)
Dashboard: Panel 15 shows trend declining
Investigation so far: Checked service health (OK), no recent deployment

Attempted actions:
- Checked service logs ✓ (no errors)
- Verified Redis is up ✓
- Could be training data issue but need domain expertise

Can you take a look? May need model retraining decision.
```

### When Escalating from Team to Engineering Lead

```
P1 Escalation: NluCircuitBreakerOpen

Status: CRITICAL, circuit breaker OPEN for 10 minutes
Service: NLU model inference
Impact: All intents falling back to LLM (expensive)
Root cause: NLU service crashing on every request

Actions taken:
- Restarted service ✗ (still crashing)
- Checked logs: Model load failure
- Attempted model reload ✗ (still failing)

Needs: Design decision on fallback strategy (accept failures vs. LLM-only)
Can you coordinate? May need to activate incident response.
```

### When Communicating Impact to Users

```
[If user-facing impact confirmed by Engineering Lead]

We're experiencing a brief issue with our AI assistant's intent 
understanding. We're actively working to resolve it. In the meantime:
- Chat may take slightly longer to respond
- Some features may not be available

Expected resolution: [time estimate from runbook]
Status updates: @ every 5 minutes in #status
```

---

## False Alarm Mitigation

### Alerts With Known False Alarm Rates

| Alert | False Alarm Rate | Mitigation |
|---|---|---|
| `NluConfidenceDropping` | 20% | Requires 2 consecutive data points below threshold |
| `RequestRateAnomaly` | 40% | Check if it's scheduled backup/batch job |
| `ActiveUserAnomaly` | 30% | Check if special event or holiday |
| `LlmFallbackSpike` | 5% | Usually legitimate (worth investigating) |
| `HighLatency` | 10% | Often just cascading from other issues |

### Silence Alert Procedure (If False Positive Confirmed)

**If you determine the alert is a false positive while investigating:**

1. **Document why**: Note in Slack thread what you found
2. **Silence in Alertmanager**: 
   ```
   Go to http://alertmanager:9093 → Alerts → Silence
   Add matcher: alertname = "NluConfidenceDropping" 
   Duration: 1 hour (or as appropriate)
   Reason: false positive - [reason]
   ```
3. **Root cause**: Create issue to fix alert rule threshold
4. **DO NOT** silence and ignore - always root cause!

---

## Post-Incident Review Process

### Timing
- **P0/P1 (Critical)**: Review scheduled within 24 hours
- **P2 (Warning)**: Review scheduled within 1 week
- **P3 (Info)**: Documented in incident log, review monthly

### Required Attendees
- Incident commander
- On-call engineer who responded
- Team lead for affected service
- Engineering lead (for P0/P1 only)

### Key Questions
1. What went wrong? (Root cause)
2. How did we detect it? (Alert effectiveness)
3. How long until resolved? (MTTR)
4. What could have prevented it? (Prevention)
5. What will we change? (Action items)

### Output
- Post-incident report filed in [GitHub/Issues]
- Action items assigned with deadlines
- Runbook updated if needed
- Team trained on prevention

---

## Out-of-Hours Escalation (Nights/Weekends)

**If on-call engineer unreachable for 5 minutes**:

1. Automatic escalation to backup on-call
2. Page engineering director
3. If 10 minutes passed: Page VP Engineering
4. If 15 minutes passed: War room initiated

**Director authority during business hours unavaialble:**
- Director may approve: Service degradation, Disable features, Emergency rollbacks
- Director will notify CEO for major incidents

---

## Contact Information

**Quick Dial**:
- PagerDuty: https://caredroid.pagerduty.com
- On-call schedule: Slack #on-call-schedule
- Incident channel: Slack #incident-management
- War room video: Zoom link in PagerDuty escalation

**Email Aliases**:
- engineering-leads@caredroid.com
- on-call@caredroid.com
- incidents@caredroid.com

**Phone Numbers** (for actual emergencies):
- Engineering director: [stored in PagerDuty]
- VP Engineering: [stored in PagerDuty]
- 24/7 Emergency line: [stored in PagerDuty]

---

## FAQ / Common Questions

**Q: I got paged at 2 AM with a WARNING alert, shouldn't that be silent?**  
A: If it's a WARNING, check if it was escalated by an on-call team member. Only P0/P1 (CRITICAL) should page on-call at night. Report to Engineering Lead.

**Q: Can I silence an alert permanently to stop false positives?**  
A: No. Silence only temporarily while debugging. File an issue to fix the alert rule. Hiding alerts leads to missed real problems.

**Q: What if the runbook doesn't have my exact situation?**  
A: Follow the escalation procedure. The runbook covers 80% of cases, escalate for the other 20%.

**Q: Do I need to follow all the investigation steps?**  
A: No, use your judgment. If you know the answer quickly, fix it. Runbooks are for when you're stuck.

**Q: How long do I investigate before escalating?**  
A: Follow the SLA. For CRITICAL: 1 minute max before escalation. For WARNING: 5 minutes max.

**Q: What if I'm not sure if it's CRITICAL or WARNING?**  
A: When in doubt, treat as CRITICAL and escalate. Better to over-escalate than under-escalate.

---

**Last Updated**: January 30, 2026  
**Owner**: Engineering Leadership  
**Severity**: FOUNDATIONAL - All team members must understand

---
