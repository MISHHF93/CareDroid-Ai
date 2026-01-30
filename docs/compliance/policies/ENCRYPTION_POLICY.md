# Encryption Policy

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Security

## Purpose
Protect PHI by enforcing encryption in transit and at rest.

## Scope
All CareDroid data systems that process or store PHI.

## Policy
- Data in transit must use TLS 1.2+ with strong cipher suites.
- Data at rest must be encrypted with AES-256 or stronger.
- Keys are managed via a centralized key management system.
- Key rotation occurs at least annually or upon compromise.
- Encryption controls apply to backups and logs containing PHI.

## Implementation Requirements
- Enforce HTTPS with HSTS for all external endpoints.
- Use encrypted storage volumes for databases and backups.
- Prohibit plaintext storage of PHI in logs.

## Exceptions
Exceptions require documented approval and a compensating control plan.
