# Alert Runbook: EmergencyDetected

**Alert Severity**: 🔴 **CRITICAL**  
**Module**: Medical Control Plane  
**Dashboard Panels**: System-wide / all panels (highest priority)  
**Related Metrics**: `emergency_detection_total`

---

## What This Alert Means

The system has detected a real-time emergency condition (cardiac arrest, severe trauma, critical vital signs, etc.). This is the most severe alert - user safety is at risk and requires immediate action. The automated emergency detection module identified clinical criteria that demand intervention.

---

## Quick Diagnosis (< 30 seconds)

1. **Acknowledge the alert NOW** - This is not a test
2. **Check emergency type**: In Alertmanager, look at label `emergency_type` (cardiac_arrest | respiratory_failure | seizure | severe_trauma | critical_vitals)
3. **Activate emergency protocol**: Contact emergency services if applicable based on alert severity label

---

## Common Root Causes

### Root Cause 1: Legitimate Emergency
- **Symptom**: Emergency detection timestamp matches when user reported feeling unwell
- **Verification**: Check chat logs and vital signs timeline
- **Impact**: User needs immediate medical attention

### Root Cause 2: False Positive (Sensor Error)
- **Symptom**: Vital signs readings are physiologically impossible (BP 500/200) or intermittent
- **Verification**: Check medical device error logs, verify sensor calibration
- **Impact**: User alarm fatigue, but no real emergency

### Root Cause 3: Edge Case (Threshold Bug)
- **Symptom**: Same pattern repeating, threshold slightly too aggressive
- **Verification**: Review emergency detection algorithm settings
- **Impact**: Repeated false alarms

---

## Investigation Checklist

### IMMEDIATE (30 seconds):
- [ ] Contact emergency responders if emergency is real (call 911 or appropriate number)
- [ ] Notify user: "Emergency services have been alerted"
- [ ] Alert on-call medical director or clinical supervisor

### In Parallel (1-2 minutes):
- [ ] Check vital signs timeline in [medical-control-plane dashboard](http://grafana:3000/d/medical-control-plane)
- [ ] Verify this is not a sensor malfunction (check multiple vitals for consistency)
- [ ] Check chat logs for context: Did user report symptoms?
- [ ] Check device connection status (is wearable still connected?)

### If False Positive Suspected:
- [ ] Review emergency detection algo thresholds in [backend/src/modules/medical-control-plane/detection.service.ts](backend/src/modules/medical-control-plane/detection.service.ts)
- [ ] Check recent threshold changes: `git log --oneline -10 detection.service.ts`
- [ ] Verify sensor calibration data for this device

---

## Resolution Steps

### If Emergency is Real:
```bash
# Ensure emergency services engagement
# Contact medical director immediately
# This alert should NOT be manually resolved - emergency services resolve it

# Log the incident
docker-compose exec backend npm run cli log-incident \
  --type emergency \
  --user-id [user-id] \
  --emergency-type [cardiac_arrest|etc] \
  --action taken
```

### If False Positive (Sensor Error):
```bash
# Disable the problematic sensor temporarily
docker-compose exec backend npm run cli disable-sensor \
  --user-id [user-id] \
  --sensor-type [heart_rate|blood_pressure|etc]

# Notify user of sensor issue
# Request sensor recalibration or replacement

# Wait for medical assessment before re-enabling
```

### If False Positive (Algorithm Bug):
```bash
# Update threshold in detection service
# Edit backend/src/modules/medical-control-plane/detection.service.ts
# Lower emergency_threshold_[condition] by 5-10%

# Redeploy and monitor
docker-compose up -d --build backend

# Review the 10 alerts before this one to see pattern
```

---

## How to Verify Resolution

- [ ] If real emergency: Emergency services acknowledged and user is under care
- [ ] If false positive: Alert does NOT re-fire within next 24 hours
- [ ] Medical director has signed off on incident classification
- [ ] Sensor/algorithm issue documented for post-incident review

---

## Escalation Procedure

### Level 1: Immediate (< 1 minute)
- **Who**: On-call engineer sees alert first
- **Action**: Page on-call medical director IMMEDIATELY. Do not investigate, just escalate.

### Level 2: Medical (< 5 minutes)
- **Who**: On-call medical director receives page
- **Action**: Assess emergency authenticity, determine if real or false positive
- **Decision**: Contact emergency services or investigate sensor issue

### Level 3: Clinical (< 15 minutes)
- **Who**: If real emergency and emergency services not responding, contact hospital directly
- **Who**: If false positive, clinical supervision team to prevent repeated alarms

---

## Prevention for Next Time

- [ ] Add multi-sensor confirmation (don't rely on single vital sign)
- [ ] Implement sensor validation (reject physiologically impossible values)
- [ ] Add notification to user BEFORE emergency alert (give them 10 seconds to dismiss manually if it's false alarm)
- [ ] Regular sensor calibration checks (monthly)
- [ ] Quarterly accuracy audit of emergency detection algorithm

---

## Related Alerts

- `HighErrorRate` - If simultaneously firing, may indicate system degradation affecting sensors
- `DatabaseConnectionPoolExhausted` - If firing, may indicate vital signs not being persisted correctly

---

**Last Updated**: January 30, 2026  
**Runbook Version**: 1.0  
**Owner**: Medical Control Plane Team  
**Severity**: CRITICAL - User safety at risk

---
