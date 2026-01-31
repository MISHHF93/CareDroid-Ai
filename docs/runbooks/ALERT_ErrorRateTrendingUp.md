# Alert Runbook: ErrorRateTrendingUp

**Severity**: WARNING  
**Category**: Reliability Degradation (Trending)  
**SLI Impact**: SLI-5 (API Error Rate)  
**Response Time**: 5 min, 15 min action

## What This Alert Means
Application errors are increasing over 2+ hours. Error rate rising >0.5%/hour. If continues, will breach SLI-5 target (99.9%) in 6 hours.

## Quick Diagnosis  
1. Check Master Dashboard Panel 4 (error rate)
2. View error breakdown by type
3. Identify if specific endpoint/service causing errors

## Common Causes
- Unhandled exception in new code
- External service dependency timeout/down
- Configuration error
- Database unavailable or overloaded
- Memory/resource exhaustion

## Resolution
1. Check recent deployments (git log)
2. Check error logs for patterns
3. If recent deployment caused: Rollback
4. If dependency down: Investigate dependency
5. If resource issue: Scale or optimize

## Escalation
- >2% error rate: Critical, escalate immediately
- >5 min duration: Page on-call lead
