# HIPAA Security Rule Compliance Matrix

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Compliance & Security

## Purpose
This document maps the HIPAA Security Rule requirements (45 CFR §164.308, §164.310, §164.312, and §164.316) to CareDroid implementation controls and evidence locations.

## Administrative Safeguards (45 CFR §164.308)

| Requirement | Implementation Control | Evidence / Location | Status |
|---|---|---|---|
| Security Management Process (Risk Analysis, Risk Management, Sanction Policy, IS Activity Review) | Formal risk assessment, risk register, and remediation tracking; continuous monitoring alerts | docs/compliance/RISK_ASSESSMENT.md; monitoring dashboards | In progress |
| Assigned Security Responsibility | Security Officer assigned with defined responsibilities | This document; org security charter | In progress |
| Workforce Security | Role-based access; onboarding/offboarding checklist; access revocation | Access control policy; IAM logs | In progress |
| Information Access Management | Least privilege RBAC; permission mapping; administrative approvals | docs/compliance/policies/ACCESS_CONTROL_POLICY.md | In progress |
| Security Awareness & Training | Annual HIPAA training; phishing awareness; incident reporting | docs/training/HIPAA_TRAINING.md | In progress |
| Security Incident Procedures | Incident response plan with escalation and breach handling | docs/compliance/INCIDENT_RESPONSE_PLAN.md | In progress |
| Contingency Plan | Backup, recovery, DR testing, and RTO/RPO definitions | docs/compliance/policies/BACKUP_RECOVERY_POLICY.md | In progress |
| Evaluation | Periodic technical and non-technical evaluations | Annual audit checklist; pentest reports | Planned |
| Business Associate Contracts | BAAs for vendors handling PHI | docs/compliance/BAA_LIST.md | In progress |

## Physical Safeguards (45 CFR §164.310)

| Requirement | Implementation Control | Evidence / Location | Status |
|---|---|---|---|
| Facility Access Controls | Managed cloud infrastructure; restricted access; MFA enforced | Cloud provider access logs | In progress |
| Workstation Use | Policy defining authorized use; device security requirements | HIPAA training; endpoint policy | In progress |
| Workstation Security | Device encryption; automatic lock; endpoint protection | Endpoint baseline checklist | In progress |
| Device and Media Controls | Secure disposal; media sanitization; inventory | Asset management policy | Planned |

## Technical Safeguards (45 CFR §164.312)

| Requirement | Implementation Control | Evidence / Location | Status |
|---|---|---|---|
| Access Control | Unique user IDs, strong auth, MFA, RBAC | docs/compliance/policies/ACCESS_CONTROL_POLICY.md | In progress |
| Emergency Access Procedure | Emergency access workflow; audit trails | Emergency access documentation | Planned |
| Automatic Logoff | Session timeouts; idle session enforcement | Backend session policy | In progress |
| Encryption/Decryption | TLS in transit; AES-256 at rest; key rotation | docs/compliance/policies/ENCRYPTION_POLICY.md | In progress |
| Audit Controls | Immutable audit logging; log integrity verification | docs/compliance/policies/AUDIT_LOGGING_POLICY.md | In progress |
| Integrity | Hash chaining for audit logs; checksums for backups | Audit module specs | In progress |
| Person or Entity Authentication | MFA and device fingerprinting where applicable | Auth module specs | In progress |
| Transmission Security | TLS 1.2+ with strong ciphers; HSTS | Security config | In progress |

## Policies and Procedures (45 CFR §164.316)

| Requirement | Implementation Control | Evidence / Location | Status |
|---|---|---|---|
| Policies and Procedures | Written security policies | docs/compliance/policies/* | In progress |
| Documentation | Versioned compliance documentation | docs/compliance/* | In progress |
| Retention | Retain documentation for 6 years | Compliance policy; storage retention | Planned |

## Notes
- Controls listed as “In progress” will be finalized as engineering tasks complete.
- Evidence references will be updated during audits.
- This matrix is reviewed quarterly or upon major system changes.
