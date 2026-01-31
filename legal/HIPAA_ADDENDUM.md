# HIPAA Addendum for CareDroid-AI

**Effective Date:** January 31, 2026  
**Version:** 1.0

## Purpose

This HIPAA Addendum supplements the CareDroid-AI [Privacy Policy](./PRIVACY_POLICY.md) and [Terms of Service](./TERMS_OF_SERVICE.md) to provide specific information about our HIPAA compliance practices.

---

## 1. HIPAA Compliance Statement

CareDroid-AI is committed to full compliance with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule (45 CFR Part 160 and Part 164, Subparts A and E) and Security Rule (45 CFR Part 160 and Part 164, Subparts A and C).

### 1.1 Covered Entity Status
- **For Healthcare Providers Using CareDroid-AI:** You are the Covered Entity, and we act as your Business Associate
- **For Direct Consumer Users:** We act as a Covered Entity for PHI created through our Service

### 1.2 Business Associate Agreements (BAA)
All third-party service providers with access to PHI have executed HIPAA-compliant Business Associate Agreements:
- OpenAI (AI language models)
- Pinecone (vector database)
- AWS/Google Cloud (infrastructure)
- Sentry (error tracking - anonymized)

---

## 2. Protected Health Information (PHI) We Handle

### 2.1 PHI Elements Collected
- Patient demographic information
- Medical history and conditions
- Medication records and prescriptions
- Laboratory results and interpretations
- Clinical assessments (SOFA scores, vital signs)
- Treatment plans and recommendations
- Provider notes and observations
- Emergency contact information
- Insurance information (if provided)

### 2.2 De-Identified Data
We may create de-identified datasets per HIPAA Safe Harbor method (§164.514(b)) for:
- Research and development
- Quality improvement
- Population health analytics
- Machine learning model training

**Note:** De-identified data is not subject to HIPAA restrictions.

---

## 3. Minimum Necessary Standard

### 3.1 Access Controls
We limit PHI access to the minimum necessary to:
- Provide the requested Service features
- Fulfill the intended clinical purpose
- Maintain security and compliance

### 3.2 Role-Based Access
- **System Administrators:** Full access for maintenance (audit logged)
- **Clinical Support:** Limited access for customer support
- **Automated Systems:** Algorithmic access only (AI models)
- **Auditors:** Read-only access for compliance verification

---

## 4. Administrative Safeguards

### 4.1 Security Management Process
- **Risk Analysis:** Annual comprehensive risk assessments
- **Risk Management:** Documented mitigation strategies
- **Sanction Policy:** Employee violations result in disciplinary action up to termination
- **Information System Activity Review:** Daily monitoring of audit logs

### 4.2 Workforce Training
- All employees complete HIPAA training within 30 days of hire
- Annual refresher training required
- Role-specific training for developers and operations staff
- Breach notification procedures training

### 4.3 Security Incident Procedures
- 24/7 security monitoring via Sentry, Prometheus, and alerting
- Incident Response Plan: See [INCIDENT_RESPONSE_PLAN.md](../docs/compliance/INCIDENT_RESPONSE_PLAN.md)
- Post-incident analysis and corrective actions
- Breach notification within 60 days per §164.404

### 4.4 Business Associate Management
- Written BAAs with all vendors handling PHI
- Annual vendor audits and compliance verification
- Vendor termination rights upon breach
- Vendor performance monitoring

### 4.5 Access Management
- Unique user identifiers (no shared accounts)
- Emergency access procedures (break-glass protocols)
- Automatic session timeout after 15 minutes
- Access termination procedures (immediate upon employee departure)

---

## 5. Physical Safeguards

### 5.1 Facility Access Controls
- Cloud infrastructure hosted in SOC 2 Type II certified data centers
- Physical access restricted to authorized personnel
- Biometric and badge-based entry systems
- Video surveillance and access logs

### 5.2 Workstation Security
- Encrypted hard drives (BitLocker/FileVault)
- Auto-lock after 5 minutes of inactivity
- Prohibition of PHI on personal devices (unless MDM enrolled)
- Clean desk policy for physical documents

### 5.3 Device and Media Controls
- Encrypted backups in geographically distributed regions
- Secure disposal procedures (data wiping per NIST 800-88)
- Media inventory and tracking
- Backup encryption (AES-256)

---

## 6. Technical Safeguards

### 6.1 Access Control
- **Unique User Identification:** Every user has unique credentials
- **Emergency Access:** Break-glass procedure for critical situations
- **Automatic Logoff:** 15-minute inactivity timeout
- **Encryption and Decryption:** AES-256-GCM for data at rest

### 6.2 Audit Controls
- Comprehensive audit logging of all PHI access
- Hash-chained immutable logs (tamper-evident)
- Log retention: 7 years per HIPAA requirements
- Real-time monitoring and alerting

### 6.3 Integrity Controls
- Database integrity checks (checksums, foreign key constraints)
- Electronic signature verification for audit logs
- Version control and change tracking
- Automated backup verification

### 6.4 Transmission Security
- TLS 1.3 for all network communications
- Certificate pinning in mobile apps
- VPN for administrative access
- No cleartext transmission of PHI

---

## 7. Your HIPAA Rights

### 7.1 Right of Access (§164.524)
You may request a copy of your PHI in electronic or paper format. We will provide access within 30 days.

**How to Request:**
- Email: privacy@caredroid-ai.com
- In-app: Settings → Privacy → Request My Data

**Fee:** $0 for electronic copy; $0.25/page for paper copies (postage may apply)

### 7.2 Right to Amend (§164.526)
You may request amendments to inaccurate or incomplete PHI. We will respond within 60 days.

**Note:** We may deny amendment requests if:
- Information was not created by CareDroid-AI
- Information is accurate and complete
- Information is not available for your inspection

### 7.3 Right to an Accounting of Disclosures (§164.528)
You may request a list of PHI disclosures made in the past 6 years (excluding treatment, payment, operations).

**Accounting Includes:**
- Date of disclosure
- Recipient of PHI
- Description of information disclosed
- Purpose of disclosure

### 7.4 Right to Request Restrictions (§164.522)
You may request restrictions on how we use or disclose your PHI. We will consider your request but are not required to agree except:
- **Required Restriction:** If you pay out-of-pocket in full, we will not disclose PHI to your health plan for that service

### 7.5 Right to Confidential Communications (§164.522)
You may request alternative communication methods or locations (e.g., email instead of phone, alternate address).

### 7.6 Right to Breach Notification (§164.404)
If your PHI is breached, we will notify you within 60 days, including:
- Description of the breach
- Types of PHI involved
- Steps we've taken to mitigate harm
- Steps you can take to protect yourself
- Our contact information

### 7.7 Right to Opt-Out of Certain Uses
You may opt out of:
- Marketing communications (does not affect treatment)
- Fundraising (N/A currently)
- Sale of PHI (we never sell PHI regardless)

---

## 8. Permitted Uses and Disclosures

### 8.1 Treatment, Payment, Healthcare Operations (TPO)
We may use and disclose your PHI for:
- **Treatment:** Providing medical assistance, emergency dispatch, clinical decision support
- **Payment:** Processing subscription payments (minimal PHI)
- **Healthcare Operations:** Quality improvement, auditing, legal compliance

**Note:** TPO uses do not require your authorization.

### 8.2 Required by Law
We must disclose PHI when:
- You request access to your own PHI
- U.S. Department of Health and Human Services (HHS) conducts compliance investigations

### 8.3 Public Health Activities
We may disclose PHI for:
- Disease surveillance and reporting
- FDA adverse event reporting (medical device issues)
- Public health emergency response

### 8.4 Law Enforcement
We may disclose PHI to law enforcement:
- In response to court orders, warrants, subpoenas
- To identify suspects or victims
- For reporting crimes on our premises
- In emergency situations (imminent threat)

### 8.5 Emergency Circumstances
We may disclose PHI without authorization:
- To emergency responders (911 dispatch)
- To prevent imminent serious harm
- For disaster relief efforts

### 8.6 Research (De-Identified Only)
We may use de-identified data for research without authorization. Identifiable PHI for research requires:
- Your written authorization
- Institutional Review Board (IRB) approval
- Waiver of authorization (rare circumstances)

---

## 9. Authorizations Required

### 9.1 When Authorization Is Needed
Your written authorization is required for:
- Marketing communications (except appointment reminders)
- Sale of PHI (we never do this)
- Most uses of psychotherapy notes (if applicable)
- Disclosures not otherwise permitted by HIPAA

### 9.2 Authorization Elements
Valid authorizations must include:
- Description of PHI to be disclosed
- Purpose of disclosure
- Recipient(s) of the information
- Expiration date or event
- Your signature and date
- Right to revoke statement

### 9.3 Revoking Authorization
You may revoke authorization at any time by:
- Email: privacy@caredroid-ai.com
- In-app: Settings → Privacy → Manage Authorizations

**Note:** Revocation does not affect disclosures already made.

---

## 10. Breach Notification Procedures

### 10.1 Definition of Breach
A breach is an impermissible use or disclosure of PHI that compromises security or privacy.

### 10.2 Our Breach Response
1. **Detection:** Automated monitoring and incident detection
2. **Containment:** Immediate isolation of affected systems
3. **Risk Assessment:** Evaluate probability of harm (4-factor test)
4. **Notification:** Inform affected individuals within 60 days
5. **Reporting:** Notify HHS (and media if >500 individuals)
6. **Mitigation:** Implement corrective actions
7. **Documentation:** Maintain breach logs for 6 years

### 10.3 Notification Content
Breach notifications include:
- Brief description of the breach
- Types of PHI involved
- Steps individuals should take
- Our mitigation efforts
- Contact information for questions

### 10.4 When We Are NOT Obligated to Notify
- Encrypted PHI (unreadable, unusable, indecipherable)
- Limited data sets with low probability of compromise
- PHI disclosed in error to authorized personnel

---

## 11. Security Rule Implementation

### 11.1 Access Control (§164.312(a)(1))
- ✅ Unique user identifiers
- ✅ Emergency access procedures
- ✅ Automatic logoff
- ✅ Encryption and decryption

### 11.2 Audit Controls (§164.312(b))
- ✅ Comprehensive logging of PHI access
- ✅ Hash-chained immutable audit logs
- ✅ Real-time monitoring and alerting

### 11.3 Integrity (§164.312(c)(1))
- ✅ Data integrity verification
- ✅ Checksums and validation
- ✅ Electronic signature mechanisms

### 11.4 Person or Entity Authentication (§164.312(d))
- ✅ Password policies (12+ characters, complexity)
- ✅ Two-factor authentication (TOTP, backup codes)
- ✅ Biometric authentication (optional)

### 11.5 Transmission Security (§164.312(e)(1))
- ✅ TLS 1.3 encryption
- ✅ Certificate pinning
- ✅ Network segmentation

---

## 12. Compliance and Oversight

### 12.1 Privacy Officer
**Name:** [Privacy Officer Name]  
**Email:** privacy@caredroid-ai.com  
**Responsibilities:**
- Develop and implement privacy policies
- Investigate privacy complaints
- Conduct workforce training
- Monitor compliance

### 12.2 Security Officer
**Name:** [Security Officer Name]  
**Email:** security@caredroid-ai.com  
**Responsibilities:**
- Implement security policies
- Conduct risk assessments
- Monitor security incidents
- Manage access controls

### 12.3 Audits and Assessments
- **Internal Audits:** Quarterly
- **External Audits:** Annual (SOC 2 Type II)
- **Penetration Testing:** Bi-annual
- **Vulnerability Scanning:** Continuous (Snyk, OWASP ZAP)

### 12.4 Compliance Documentation
All compliance documentation available upon request:
- Risk assessments
- Security policies
- Workforce training records
- Incident response logs
- Business Associate Agreements

---

## 13. Contact Information

### 13.1 Privacy Questions
**Privacy Officer:** privacy@caredroid-ai.com  
**Phone:** [Privacy Officer Phone]

### 13.2 Security Concerns
**Security Officer:** security@caredroid-ai.com  
**Phone:** [Security Officer Phone]  
**24/7 Incident Hotline:** [Emergency Number]

### 13.3 File a Complaint
If you believe your privacy rights have been violated:

**File with CareDroid-AI:**
- Email: compliance@caredroid-ai.com
- Mail: Compliance Officer, CareDroid-AI, Inc., [Address]

**File with HHS:**
- Office for Civil Rights (OCR)
- Website: hhs.gov/ocr/privacy/hipaa/complaints
- Phone: 1-877-696-6775

**No Retaliation:** You will not be retaliated against for filing a complaint.

---

## 14. Effective Date and Updates

**Effective Date:** January 31, 2026  
**Last Updated:** January 31, 2026  
**Next Review:** July 31, 2026

We reserve the right to change our HIPAA practices and make new provisions effective for all PHI we maintain. Material changes will be communicated via:
- Email notification
- In-app notification
- Updated posted policies (30 days' notice)

---

## 15. Acknowledgment

By using CareDroid-AI, you acknowledge that you have received this HIPAA Addendum and understand your rights under HIPAA.

**For Healthcare Providers:** If you are a covered entity, a separate Business Associate Agreement is required. Contact legal@caredroid-ai.com.

---

**Document Version:** 1.0  
**Approved By:** [Legal Counsel Name]  
**Compliance Review Date:** [To be completed]
