# Business Associate Agreements (BAA) List

Organization: aLRELEVANT REGULATORS
Version: 1.0
Date: January 30, 2026
Owner: Compliance & Security

## Purpose
Maintain a record of third-party vendors that may handle PHI and the status of their Business Associate Agreements (BAAs).

## Vendor Inventory

| Vendor | Service | PHI Exposure | BAA Status | Notes |
|---|---|---|---|---|
| OpenAI | LLM inference for clinical assistance | Possible (prompt content) | Required / Pending | Ensure PHI handling limitations and BAA execution |
| Pinecone | Vector database for RAG | Possible (embedded text) | Required / Pending | Verify encryption and data retention |
| AWS | Hosting infrastructure | Likely (compute/storage) | Required / Pending | Confirm HIPAA-eligible services |
| Microsoft Azure | Hosting or identity services | Possible | Required / Pending | If used, ensure HIPAA coverage |
| Redis | Caching | Minimal (avoid PHI) | Not required if no PHI | Verify configuration |

## Review and Updates
- Reviewed quarterly or upon new vendor onboarding.
- BAAs must be executed before PHI is processed by any vendor.

## Owner
Compliance Officer
