# PHI Data Flows

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Compliance & Security

## Purpose
Document the flow of Protected Health Information (PHI) through the CareDroid system, including encryption controls at each stage.

## High-Level Flow
1. User (clinician) enters a query containing PHI via the web/mobile client.
2. The frontend transmits the request to the backend API over TLS.
3. The backend stores and processes the request and persists PHI in the database.
4. The backend may call internal services (NLU, RAG) over secure internal network.
5. The backend returns the response to the client over TLS.

## Data Flow Diagram (Textual)
User Device
  ↓ (TLS 1.2+)
Frontend (Web/Mobile)
  ↓ (TLS 1.2+)
Backend API (NestJS)
  ↓ (Encrypted at rest)
Primary Database (PostgreSQL)
  ↔ (Encrypted in transit)
Internal Services (NLU, RAG, Redis)
  ↓ (TLS 1.2+)
Response to User

## PHI Touchpoints

| Component | PHI Handling | Encryption In Transit | Encryption At Rest |
|---|---|---|---|
| Frontend | Displays PHI to authorized users | TLS 1.2+ | N/A (no local persistence) |
| Backend API | Processes PHI, applies access controls | TLS 1.2+ | Encrypted database storage |
| PostgreSQL | Primary PHI storage | TLS between services | AES-256 (DB or volume encryption) |
| Redis | Temporary cache (non-PHI preferred) | TLS if enabled | Encryption at rest if configured |
| NLU Service | Receives PHI for classification | Internal TLS / network isolation | No PHI persistence |
| RAG Service | Retrieves contextual content | Internal TLS / network isolation | Vector store encrypted at rest |
| Logs/Audit | Security audit trails | TLS to log store | Encrypted at rest, immutable controls |

## Encryption Controls
- In transit: TLS 1.2+ for all external communications, TLS 1.2+ or mTLS for internal services.
- At rest: AES-256 for database volumes; encrypted backups.
- Key management: centralized key management service with rotation policy.

## Access Controls
- Role-Based Access Control (RBAC) enforced at backend API.
- Least privilege for database accounts and internal service credentials.
- MFA required for administrative access.

## Retention and Minimization
- PHI data retained according to retention policy (minimum 6 years for compliance).
- Data minimization practices applied to logs and telemetry.

## Change Management
Any change to PHI data flows triggers a compliance review and documentation update.
