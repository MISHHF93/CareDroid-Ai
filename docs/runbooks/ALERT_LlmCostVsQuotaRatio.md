# Alert Runbook: LlmCostVsQuotaRatio

**Severity**: WARNING  
**Category**: Cost Control - Budget Planning  
**SLI Impact**: SLI-6 (Cost Efficiency)  
**Response Time**: 24 hours (not urgent), informational

## What This Alert Means
YTD LLM costs have consumed >80% of the $500/month budget. If current spending rate continues, budget will be exhausted mid-month. This is a **planning alert**, not an emergency.

## Quick Diagnosis
1. Check Cost Intelligence dashboard, Panel 4 (budget gauge)
2. Calculate days remaining in month
3. Estimate daily spend rate
4. See if sustainable or need intervention

**Example**:
- Today: Jan 25, spent $400 of $500
- Days remaining: 6
- Budget remaining: $100
- Current daily rate: $60/day
- **Action needed**: Will exceed budget in 1.7 days

## Common Causes
- System usage growing (more users, more queries)
- New features using expensive models
- Inefficient queries (high token count)
- Unexpected traffic spike

## Resolution  
1. **Short-term** (this month):
   - Reduce fallback to cheap models
   - Increase NLU confidence threshold
   - Disable expensive features
   - Reduce context window size

2. **Medium-term** (next month):
   - Optimize token usage (context pruning)
   - Switch heavy queries to cheaper models
   - Implement caching
   - Batch similar queries

3. **Long-term**:
   - Request budget increase with leadership
   - Implement cost forecasting
   - Usage-based pricing (charge users proportionally)

## Escalation
- Escalate to finance/product for budget planning
- Not urgent, can wait 2-4 hours
- Inform leadership if pattern shows year-end budget overrun

## Prevention
- Monthly budget review (1st of month)
- Daily spend rate monitoring
- Cost forecast for rest of quarter
- Alert on pace (80%, 90%, 95% of budget)
