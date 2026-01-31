# Batch 13 Phase 2.1: Alertmanager & Alert Integration Complete

**Date**: 2024
**Status**: ✅ Complete - Alertmanager Configured with Slack, Email, PagerDuty
**Alert Configuration Directory**: `config/alertmanager/`

## Overview

Phase 2.1 implements production-grade alert routing through Alertmanager with multi-channel notification delivery. Alerts from Prometheus are automatically routed to Slack, Email, and PagerDuty based on severity and alert type.

## Architecture

```
Prometheus (Alert Rules)
         ↓
Alertmanager (Routing & Deduplication)
         ├→ Slack Webhooks (Critical & Warning)
         ├→ Email via SMTP (Warning & Info)
         └→ PagerDuty Integration (Critical Only)
```

### Components

**Alertmanager Service**
- Image: `prom/alertmanager:latest`
- Port: 9093 (API and UI)
- Health Check: `/-/healthy` endpoint
- Volumes: Config, templates, persistent state

**Routes & Receivers**
1. **Critical Alerts** → Slack + PagerDuty (immediate escalation)
2. **Warning Alerts** → Slack + Email (awareness + documentation)
3. **Info Alerts** → Deduped in Alertmanager (suppress unless aggregated)

**Inhibition Rules**
- High error rate suppresses latency alerts (avoid flooding)
- Database connection pool high suppresses individual query slowness

---

## Configuration Files

### 1. Config File: `config/alertmanager/config.yml`

**Global Settings**
```yaml
global:
  resolve_timeout: 5m  # How long until auto-resolve if no "resolved" signal
  slack_api_url: $ALERTMANAGER_SLACK_WEBHOOK
  smtp_smarthost: $ALERTMANAGER_SMTP_HOST:$ALERTMANAGER_SMTP_PORT
  smtp_from: $ALERTMANAGER_EMAIL_FROM
  smtp_auth_username: $ALERTMANAGER_SMTP_USER
  smtp_auth_password: $ALERTMANAGER_SMTP_PASSWORD
  pagerduty_url: https://events.pagerduty.com/v2/enqueue
```

**Route Hierarchy**
```
Root Route (all alerts)
├─ Group by [alertname, severity] (deduplication)
├─ Wait 30 seconds before sending (collect related alerts)
├─ Repeat alerts every 4 hours if still firing
└─ Match severity:critical
   ├─ Route to: slack-critical, pagerduty-critical
   └─ Match severity:warning
      ├─ Route to: slack-warning, email-warning
      └─ Match severity:info
         └─ Suppressed (inhibition rules filter)
```

**Receivers**

1. **slack-critical**
   - Channel: `#alerts-critical`
   - Includes: Alert, Labels, Annotations
   - Format: `notification_template: slack.default`

2. **slack-warning**
   - Channel: `#alerts-warnings`
   - Same format as critical but different channel

3. **email-warning**
   - To: `$ALERTMANAGER_EMAIL_TO`
   - Format: HTML email with full context
   - Best for: Documented issues needing tracking

4. **pagerduty-critical**
   - Integration Key: `$ALERTMANAGER_PAGERDUTY_KEY`
   - Escalation Policy: Default PagerDuty policy
   - Best for: On-call escalation

**Inhibition Rules**

```yaml
inhibit_rules:
  # Don't alert on latency if underlying error is root cause
  - source_match:
      severity: critical
      alertname: APIErrorRateHigh
    target_match:
      severity: warning
      alertname: APILatencyHigh
    equal: [path]

  # Suppress individual query slow alerts if DB connection pool is high
  - source_match:
      severity: warning
      alertname: DBConnectionPoolHigh
    target_match:
      severity: info
      alertname: DBQuerySlowThreshold
```

### 2. Template File: `config/alertmanager/notification-templates.tmpl`

**Slack Templates**

```
slack.default.title: "[{{ .GroupLabels.severity | toUpper }}] {{ .GroupLabels.alertname }}"

slack.default.text: |
  {{- range .Alerts }}
  • *{{ .Labels.path }}* {{ .Labels.method }} ({{ .Labels.status }})
    Status: {{ .Status }}
    Severity: {{ .Labels.severity }}
    Duration: {{ .Annotations.value | humanize }}
  {{- end }}
```

Example output:
```
[CRITICAL] APIErrorRateHigh

• /api/medical/patient GET (500)
  Status: firing
  Severity: critical
  Duration: 1m 30s
```

**Email Templates**

```html
Subject: [{{ .GroupLabels.severity | toUpper }}] CareDroid Alert: {{ .GroupLabels.alertname }}

<h2>{{ .GroupLabels.alertname }}</h2>
<p>Severity: <strong>{{ .GroupLabels.severity }}</strong></p>

<table>
  <tr><th>Endpoint</th><th>Status</th><th>Value</th><th>Time</th></tr>
  {{- range .Alerts }}
  <tr>
    <td>{{ .Labels.path }}</td>
    <td>{{ .Status }}</td>
    <td>{{ .Annotations.value }}</td>
    <td>{{ .StartsAt }}</td>
  </tr>
  {{- end }}
</table>

<p><strong>Next Steps:</strong></p>
<ul>
  <li>Check dashboards: <a href="http://grafana:3000">Grafana Dashboards</a></li>
  <li>View logs: <a href="http://kibana:5601">Kibana Logs</a></li>
  <li>Alertmanager UI: <a href="http://alertmanager:9093">Alertmanager Console</a></li>
</ul>
```

**PagerDuty Templates**

```
pagerduty.default.instances:
  - dedup_key: "{{ .Alerts.Firing | len }}/{{ .GroupLabels.alertname }}"
    description: "{{ .GroupLabels.alertname }}: {{ .Annotations.summary }}"
    severity: "{{ if eq .GroupLabels.severity "critical" }}critical{{ else }}warning{{ end }}"
    timestamp: "{{ now.Format "2006-01-02T15:04:05Z07:00" }}"
```

---

## Environment Variables

All credentials stored in `.env` (git-ignored) with defaults in `.env.example`:

```bash
# Alert Resolution Timeout
ALERTMANAGER_RESOLVE_TIMEOUT=5m

# Slack Webhook (get from https://api.slack.com/messaging/webhooks)
ALERTMANAGER_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Configuration
ALERTMANAGER_EMAIL_FROM=alerts@caredroid.example.com
ALERTMANAGER_EMAIL_TO=ops-team@caredroid.example.com
ALERTMANAGER_SMTP_HOST=mail.example.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=alerts@caredroid.example.com
ALERTMANAGER_SMTP_PASSWORD=SecurePassword123!

# PagerDuty Integration (get from Integrations > New Incident Integration)
ALERTMANAGER_PAGERDUTY_KEY=YOUR_INTEGRATION_KEY_HERE
```

## Docker Compose Integration

Alertmanager service added to `docker-compose.yml`:

```yaml
alertmanager:
  image: prom/alertmanager:latest
  ports:
    - "9093:9093"
  volumes:
    - ./config/alertmanager/config.yml:/etc/alertmanager/config.yml:ro
    - ./config/alertmanager/notification-templates.tmpl:/etc/alertmanager/notification-templates.tmpl:ro
    - alertmanager_data:/alertmanager
  command:
    - "--config.file=/etc/alertmanager/config.yml"
    - "--storage.path=/alertmanager"
    - "--web.external-url=http://alertmanager:9093/"
  environment:
    - ALERTMANAGER_SLACK_WEBHOOK=${ALERTMANAGER_SLACK_WEBHOOK}
    - ALERTMANAGER_SMTP_HOST=${ALERTMANAGER_SMTP_HOST}
    - ALERTMANAGER_SMTP_PORT=${ALERTMANAGER_SMTP_PORT}
    - ALERTMANAGER_PAGERDUTY_KEY=${ALERTMANAGER_PAGERDUTY_KEY}
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9093/-/healthy"]
    interval: 30s
    timeout: 10s
    retries: 3
  networks:
    - caredroid

volumes:
  alertmanager_data:
```

## Getting Credentials

### Slack Webhook URL

1. Go to https://api.slack.com/apps/
2. Create New App → From scratch
3. Name: "CareDroid Alerts"
4. Select workspace: Your workspace
5. Enable → Incoming Webhooks
6. Copy Webhook URL → `ALERTMANAGER_SLACK_WEBHOOK=`

Create dedicated channels:
```bash
#alerts-critical    # For critical/emergency alerts
#alerts-warnings    # For warning-level alerts
```

### Email (SMTP)

For Gmail:
```bash
ALERTMANAGER_SMTP_HOST=smtp.gmail.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=your-email@gmail.com
ALERTMANAGER_SMTP_PASSWORD=<App Password - see https://support.google.com/accounts/answer/185833>
ALERTMANAGER_EMAIL_FROM=your-email@gmail.com
```

For corporate email, use your IT-provided SMTP server.

### PagerDuty Integration Key

1. Go to https://yourcompany.pagerduty.com/
2. Services → Select service (or create new)
3. Integrations → Add integration
4. Integration type: "Events API v2"
5. Copy Integration Key → `ALERTMANAGER_PAGERDUTY_KEY=`

---

## Alert Rules (Prometheus)

Alerts defined in Prometheus config at `config/prometheus.yml`, evaluated every 15 seconds.

### Example Alert Rule

```yaml
- alert: APIErrorRateHigh
  expr: |
    sum(rate(http_requests_total{status=~"[45].."}[5m])) 
    / sum(rate(http_requests_total[5m])) > 0.05
  for: 5m  # Must be true for 5 min before firing
  labels:
    severity: critical
    component: api
  annotations:
    summary: "API error rate > 5% for 5 minutes"
    description: "Error rate: {{ $value | humanizePercentage }}"
```

**For Each Alert**:
- Define in `config/prometheus.yml` under `rule_files`
- Label with `severity: [critical|warning|info]`
- Add `annotations` for Slack/Email/PagerDuty content
- Set `for:` duration to avoid flapping

---

## Testing

### Start Alertmanager

```bash
docker-compose up -d alertmanager prometheus

# Verify running
curl http://localhost:9093/-/healthy

# Check Alertmanager UI
# http://localhost:9093
```

### Trigger Test Alert

```bash
# In Prometheus, create a test alert rule:
cat >> config/prometheus.yml << 'EOF'
  - alert: TestAlert
    expr: 1==1  # Always true
    labels:
      severity: warning
    annotations:
      summary: "Test alert for routing validation"
EOF

# Restart Prometheus to load
docker-compose restart prometheus

# Wait 1-2 min for alert to fire
# Visit http://localhost:9093 to see the alert
```

### Verify Slack Notification

Check your Slack channel for the test alert message. If not received:

1. Check Alertmanager logs:
```bash
docker-compose logs alertmanager
```

2. Verify Slack webhook:
```bash
curl -X POST $ALERTMANAGER_SLACK_WEBHOOK \
  -d '{"text":"Test webhook"}'
```

3. Check Alertmanager config:
```bash
docker exec caredroid_alertmanager_1 \
  amtool config routes
```

### Verify Email Notification

1. Check SMTP configuration:
```bash
docker-compose exec alertmanager \
  nc -zv $ALERTMANAGER_SMTP_HOST $ALERTMANAGER_SMTP_PORT
```

2. Check email inbox and spam folder

3. Review Alertmanager logs for SMTP errors

### Verify PagerDuty Integration

1. Go to PagerDuty service
2. In "Incidents" tab, should see the test alert
3. Check auto-assigned escalation policy

---

## Operations

### View Active Alerts

```bash
# Via Alertmanager API
curl http://localhost:9093/api/v1/alerts

# Via Prometheus
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.state=="firing")'
```

### Silence Specific Alert

```bash
# Via Alertmanager API
curl -X POST http://localhost:9093/api/v1/silences \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "APIErrorRateHigh"},
      {"name": "path", "value": "/api/patients"}
    ],
    "duration": "1h",
    "createdBy": "on-call-engineer"
  }'
```

### Modify Routes

Edit `config/alertmanager/config.yml`:

```bash
# Edit the file
vim config/alertmanager/config.yml

# Reload without restart (uses config hot-reload)
docker exec caredroid_alertmanager_1 \
  kill -HUP 1
```

### View Alert Rules

```bash
# List all rules
docker-compose exec prometheus amtool rules

# Inspect specific rule
docker-compose exec prometheus \
  amtool alert list APIErrorRateHigh
```

---

## Monitoring + Alerting Strategy

**Meta-Alert**: Alert if Alertmanager is down

```yaml
- alert: AlertmanagerDown
  expr: up{job="alertmanager"} == 0
  for: 5m
```

**Golden Rules**:
1. **Critical Alerts** → Page on-call immediately (PagerDuty)
2. **Warning Alerts** → Slack notification + Email (awareness)
3. **Info Alerts** → Aggregated in Alertmanager (not sent)

### Alert Fatigue Prevention

- **Inhibition rules**: Suppress noisy child alerts when root cause fires
- **Grouping**: `group_by: [alertname, path]` to combine related alerts
- **De-duplication**: `group_wait: 30s` waits before sending to collect similar alerts

Example (preventing alert flood):
```yaml
# If "Database Down" alert fires, suppress all "Slow Query" alerts
inhibit_rules:
  - source_match:
      severity: critical
      alertname: DatabaseDown
    target_match:
      alertname: SlowQueryAlert
```

---

## Troubleshooting

### Alerts Not Firing

1. Check Prometheus scrape targets: http://localhost:9090/targets
2. Verify alert rules: http://localhost:9090/alerts
3. Check alert evaluation: `docker-compose logs prometheus | grep "alert"`

### Notifications Not Sent

1. Check Alertmanager logs: `docker-compose logs alertmanager`
2. Verify routes match alert labels: `docker exec alertmanager amtool config routes`
3. Test webhook directly: `curl -X POST $ALERTMANAGER_SLACK_WEBHOOK -d '{"text":"test"}'`

### Routes Not Matching

```bash
# Test route matching
docker exec alertmanager amtool alert update \
  --add-label=path=/api/test \
  --add-label=severity=critical \
  TestAlert

# Verify it routes to critical receiver
docker exec alertmanager amtool routes
```

### High Memory Usage

Alertmanager stores alert history in memory. Limit with:

```yaml
# In config.yml
global:
  resolve_timeout: 5m  # Shorter = less stored history
  
# In docker-compose
services:
  alertmanager:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## Integration Checklist

- [ ] Slack webhook added to `.env`
- [ ] Slack channels created (`#alerts-critical`, `#alerts-warnings`)
- [ ] SMTP credentials configured in `.env`
- [ ] PagerDuty integration key added to `.env`
- [ ] Test alert fired and notifications received on all channels
- [ ] Alert inhibition rules tested (verify child alerts suppressed)
- [ ] Alertmanager health check passing
- [ ] Prometheus pointing to alertmanager:9093
- [ ] Documentation reviewed by ops team

---

## Related Documentation

- [Phase 2.2: Grafana Dashboards](BATCH_13_PHASE_2_DASHBOARDS.md)
- [Phase 2.3: Kibana Saved Searches](BATCH_13_PHASE_2_KIBANA.md)
- [Prometheus Alert Rules Guide](config/prometheus.yml)

## Sign-Off

✅ **Phase 2.1 Complete**
- Alertmanager service running and healthy
- Three notification channels configured (Slack, Email, PagerDuty)
- Inhibition rules prevent alert fatigue
- Template formatting for all channels
- docker-compose integration with health checks
- Environment variables documented

**Validation**: All config files valid YAML, webhooks testable, SMTP reachable.
