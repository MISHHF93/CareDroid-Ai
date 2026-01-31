# Alert Runbook: CostPerUserExceeded

**Severity**: WARNING  
**Category**: Cost Control - Per-User Budget  
**SLI Impact**: SLI-6 (Cost Efficiency)  
**Response Time**: 5 min, 15 min action

## What This Alert Means
A user has consumed >$10 in costs over 24 hours. May indicate heavy legitimate usage or potential abuse/bot activity. Normal user costs: $0.10-1.00/day.

## Quick Diagnosis
1. Check Cost Intelligence dashboard, Panel 2 (top users)
2. Identify user_id in alert label
3. Check if user is known power user or new pattern

## Common Causes
- Legitimate heavy usage (research, learning)
- User running automated tasks
- Bot/abuse using compromised account
- Feature overuse (e.g., repeatedly asking same question)

## Resolution
1. If legitimate user: Document, no action needed (may need tier upgrade)
2. If potential abuse: Check request patterns
   - Same query repeated? → rate limit
   - Burst activity? → investigate
   - Bot patterns? → block
3. If compromised: Reset credentials, monitor

## Escalation
- If >$50 user-day: Alert support team
- If bot confirmed: Security incident, escalate
