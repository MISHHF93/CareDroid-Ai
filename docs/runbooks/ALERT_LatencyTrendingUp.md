# Alert Runbook: LatencyTrendingUp

**Severity**: WARNING  
**Category**: Performance Degradation (Trending)  
**SLI Impact**: SLI-2 (API Response Latency)  
**Response Time**: 5 min acknowledge, 15 min action

## What This Alert Means
API response times are increasing over 2+ hours. The system is getting slower. If trend continues, SLI-2 (P95 < 200ms) will breach in 4-6 hours.

## Quick Diagnosis
1. Check "Master Clinical Intelligence" dashboard, Panel 3 (latency graph)
2. See if latency slope positive (increasing)
3. Check if correlates with other metrics:
   - CPU high? → resource contention
   - Memory high? → garbage collection pauses
   - Database slow? → query performance degrading
   - Traffic high? → legitimate load increase

## Common Causes
- Database connection pool exhaustion
- Slow database queries (N+1 problem)
- Memory leak causing GC pauses
- Unoptimized query hitting large dataset
- Traffic surge without scaling

## Resolution
1. Check database performance
   - `SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5`
   - Look for queries with high mean_time
2. Check memory/CPU graphs (Master dashboard panels 27-28)
3. If memory climbing: Check for leak, restart if needed
4. If DB slow: Optimize slow query or scale DB
5. If traffic surge: Scale horizontally (add pods/replicas)

## Escalation
- If continues >1 hour: Escalate to SRE
- If causes SLI breach: Escalate to director
