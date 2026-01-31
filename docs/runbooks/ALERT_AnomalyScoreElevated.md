# Alert Runbook: AnomalyScoreElevated

**Severity**: WARNING  
**Category**: ML-Based Anomaly Detection  
**SLI Impact**: Cross-cutting (confirms unusual metrics)  
**Response Time**: 5 min, 15 min action

## What This Alert Means
ML anomaly detector flagged unusual metric values. Isolation Forest assigned anomaly score > 0.7 (where 1.0 = extreme outlier). Indicates metrics outside normal distribution.

## Quick Diagnosis
1. Check metric name in alert: `{{ $labels.metric_name }}`
2. Navigate to relevant dashboard panel
3. Visually inspect if value is unusual
4. Cross-reference with other correlated metrics

## Common Causes
- Change in user behavior/traffic pattern
- System resource shortage (CPU/memory spike)
- New feature enabled affecting metrics
- Transient glitch (one bad sample)
- Legitimate operational change (scale-out event)

## Resolution
1. Determine if anomaly is real or false positive
2. If real: Investigate root cause (see specific alert runbook for metric)
3. If false positive: Tune anomaly detection (increase contamination rate)
4. Document finding for model retraining

## Escalation
- If multiple metrics anomalous: May indicate system-wide issue, escalate
- If single metric: Usually not critical, investigate at normal pace
