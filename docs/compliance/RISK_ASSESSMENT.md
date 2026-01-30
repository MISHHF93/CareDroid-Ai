# HIPAA Risk Assessment

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Compliance & Security

## Purpose
Identify and evaluate risks to the confidentiality, integrity, and availability of PHI within the CareDroid system.

## Methodology
- Identify assets and data flows.
- Assess threats and vulnerabilities.
- Evaluate likelihood and impact.
- Define mitigations and residual risk.

## Risk Register

| Risk ID | Asset | Threat | Likelihood | Impact | Mitigation | Residual Risk |
|---|---|---|---|---|---|---|
| R-001 | PHI in transit | Man-in-the-middle attack | Low | High | TLS 1.2+, HSTS, strong cipher suites | Low |
| R-002 | PHI at rest | Unauthorized DB access | Medium | High | RBAC, encryption at rest, MFA | Low |
| R-003 | API access | Credential theft | Medium | High | MFA, rate limiting, monitoring | Medium |
| R-004 | Audit logs | Tampering | Low | High | Hash chaining, immutable storage | Low |
| R-005 | Backups | Loss or corruption | Medium | High | Encrypted backups, restore testing | Low |
| R-006 | Third-party services | Vendor data exposure | Medium | High | BAAs, data minimization, vendor review | Medium |
| R-007 | Insider misuse | Unauthorized access | Medium | High | RBAC, monitoring, sanctions | Medium |
| R-008 | Availability | DDoS or outage | Medium | Medium | Load balancing, autoscaling | Medium |

## Risk Treatment Plan
- Implement mitigations listed above.
- Monitor residual risks quarterly.
- Update this assessment after major architectural changes.

## Approval
Reviewed by Compliance and Security leadership.
