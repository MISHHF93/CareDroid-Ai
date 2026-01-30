# Backup and Recovery Policy

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Security & Operations

## Purpose
Ensure availability and recoverability of PHI and critical systems.

## Scope
All production data stores, configuration repositories, and audit logs.

## Policy
- Backups occur at least daily for production databases.
- Backups are encrypted at rest and in transit.
- RPO: 24 hours. RTO: 4 hours (target).
- Backups are retained for a minimum of 6 years where required.
- Recovery tests are performed at least annually.

## Procedures
- Automated backup schedules with monitoring.
- Offsite backup storage in encrypted form.
- Restoration procedures documented and tested.

## Exceptions
Exceptions require approval from Security and Operations.
