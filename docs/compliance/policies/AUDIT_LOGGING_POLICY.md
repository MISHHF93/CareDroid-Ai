# Audit Logging Policy

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Security

## Purpose
Ensure comprehensive and tamper-evident logging for PHI access and security events.

## Scope
All CareDroid services and infrastructure components that handle PHI.

## Policy
- Log all access to PHI, including read and write operations.
- Log authentication attempts, privilege changes, and system configuration updates.
- Audit logs must be immutable and protected against tampering.
- Logs are retained for a minimum of 6 years.
- Logs are reviewed weekly for anomalies.

## Controls
- Hash chaining or equivalent integrity verification.
- Centralized log aggregation with access control.
- Alerting on suspicious or anomalous access patterns.

## Exceptions
Exceptions require documented approval and additional monitoring.
