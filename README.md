# CareDroid - Clinical AI Co-Pilot

> **Intelligent, Secure, Evidence-Based Clinical Decision Support**  
> HIPAA-Compliant | RAG-Powered | Built for Healthcare Professionals

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![HIPAA](https://img.shields.io/badge/HIPAA-Compliant-green)
![Status](https://img.shields.io/badge/status-Active%20Development-yellow)

---

## 🎯 Vision

CareDroid transforms clinical workflows by providing an **intelligent conversational interface** that serves as your personal clinical co-pilot. Instead of switching between multiple tools, you ask natural questions and the AI dynamically surfaces the right clinical calculators, protocols, and evidence-based guidelines—all within a seamless chat experience.

**Example Interactions:**
```
Doctor: "Check interactions between warfarin and aspirin"
→ CareDroid displays drug interaction analysis in-chat

Nurse: "Calculate SOFA score for: PaO2/FiO2 180, platelets 90..."
→ CareDroid executes calculator and shows result with interpretation

Resident: "What's the sepsis protocol for ED?"
→ CareDroid retrieves institutional protocol via RAG and presents steps
```

---

## ✨ Key Features

### 🧠 Medical Control Plane
Sophisticated middleware that:
- **Intent Classification**: Understands clinical requests in natural language
- **RAG Engine**: Retrieves relevant medical literature and protocols
- **Tool Orchestration**: Executes calculators, drug checkers, lab interpreters in-chat
- **Emergency Detection**: Identifies critical conditions and escalates appropriately

[Read Full Architecture →](MEDICAL_CONTROL_PLANE.md)

### 🔐 Security-First, HIPAA-By-Design
- TLS 1.3 encryption in transit, AES-256 at rest
- Role-based access control (RBAC) with MFA
- Immutable audit logs with cryptographic integrity
- Zero-trust architecture
- Data minimization and pseudonymization

### 🩺 Clinical Tools (17+ Available)
| Tool | Use Case | Example |
|------|----------|---------|
| **SOFA Calculator** | Sepsis severity | "Calculate SOFA score..." |
| **Drug Interactions** | Medication safety | "Check warfarin + aspirin" |
| **Lab Interpreter** | Lab result analysis | "Interpret: Na 128, K 5.2..." |
| **Differential Diagnosis** | DDx generation | "Chest pain with diaphoresis" |
| **Clinical Protocols** | Evidence-based guidelines | "ACLS protocol summary" |
| **Medical Calculators** | CHA2DS2-VASc, GFR, BMI | "Calculate stroke risk..." |

[Full Feature List →](PROJECT_SPEC.md#features--capabilities)

### 🌐 Multi-Platform Support
- **Web**: React 18 + Vite 5 SPA
- **Android**: Capacitor 5 (APK ready)
- **iOS**: Planned (Capacitor ready)

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                │
│  • Modern SaaS UI with dark clinical theme         │
│  • Responsive chat interface with tool cards       │
│  • Real-time streaming responses                   │
└────────────────┬───────────────────────────────────┘
                 │  HTTPS/TLS 1.3
                 ▼
┌────────────────────────────────────────────────────┐
│         NestJS API Gateway + Auth Layer            │
│  • JWT + OAuth 2.0 (Google, LinkedIn, SAML)       │
│  • Rate limiting & security headers                │
│  • Immutable audit logging                         │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│       🧠 MEDICAL CONTROL PLANE 🧠                   │
│  ┌──────────────────────────────────────────────┐ │
│  │  1. Intent Classifier (NLU)                  │ │
│  │     • Keyword matching + fine-tuned BERT      │ │
│  │     • Extracts clinical parameters            │ │
│  │                                                │ │
│  │  2. RAG Engine (Vector DB)                    │ │
│  │     • Medical literature retrieval            │ │
│  │     • Institutional protocols                 │ │
│  │                                                │ │
│  │  3. Clinical Tool Orchestrator                │ │
│  │     • Microservice routing                    │ │
│  │     • Result formatting for chat              │ │
│  │                                                │ │
│  │  4. Emergency Detector                        │ │
│  │     • Real-time critical condition alerts     │ │
│  └──────────────────────────────────────────────┘ │
└────────────────┬───────────────────────────────────┘
                 │
    ┌────────────┼────────────────┬──────────────┐
    │            │                │              │
    ▼            ▼                ▼              ▼
┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌──────────┐
│Postgres │ │  Redis  │ │ OpenAI GPT-4 │ │ Vector DB│
│(Encrypted)│ │Sessions│ │              │ │  (RAG)   │
└─────────┘ └─────────┘ └──────────────┘ └──────────┘
```

[Detailed Architecture Diagrams →](MEDICAL_CONTROL_PLANE.md)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 6+
- OpenAI API Key

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/care-droid-app.git
cd care-droid-app

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 4. Run database migrations
cd backend && npm run migration:run

# 5. Start development servers
npm run start:all
# Frontend: http://localhost:8000
# Backend: http://localhost:3000
```

### Environment Variables

```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/caredroid
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-256-bit-secret>
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

[Full Environment Setup →](PROJECT_SPEC.md#local-setup)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[PROJECT_SPEC.md](PROJECT_SPEC.md)** | Comprehensive technical specification (12 sections) |
| **[MEDICAL_CONTROL_PLANE.md](MEDICAL_CONTROL_PLANE.md)** | Detailed architecture of AI middleware layer |
| **[AI_CHAT_UI_SPEC.md](AI_CHAT_UI_SPEC.md)** | Design system and UI guidelines |
| **[LAYOUT_SPEC.md](LAYOUT_SPEC.md)** | Shell architecture and routing |
| **[ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md)** | Android APK build instructions |
| **[QUICK_START.md](QUICK_START.md)** | Developer onboarding guide |
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Deployment guide |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (functional components + hooks)
- **Build Tool**: Vite 5 (fast HMR, optimized builds)
- **Routing**: React Router v6
- **Styling**: CSS-in-JS + CSS variables
- **Mobile**: Capacitor 5 (Android + iOS)

### Backend
- **Framework**: NestJS 10 (TypeScript, dependency injection)
- **Runtime**: Node.js LTS
- **Database**: PostgreSQL 14 (TypeORM)
- **Cache**: Redis 6
- **AI**: OpenAI GPT-4 + text-embedding-ada-002
- **Auth**: Passport.js (JWT, OAuth 2.0, SAML)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston (logging), Sentry (errors)
- **Security**: Helmet, bcrypt, rate-limiting

[Complete Dependency List →](PROJECT_SPEC.md#technology-stack)

---

## 🎨 Design System

### Visual Identity
- **Theme**: Dark clinical UI with high-contrast text
- **Primary Colors**: Deep navy background, electric cyan/green accents
- **Typography**: Sans-serif, 12px-36px scale
- **Components**: Glass-morphism cards, subtle shadows, smooth animations

### Design Tokens
```css
--navy-bg: #0b1220
--accent-cyan: #00FFFF
--accent-green: #00FF88
--gradient-accent: linear-gradient(135deg, #00FF88, #00FFFF)
--text-primary: #f8fafc
--text-muted: rgba(248, 250, 252, 0.6)
```

[Full Design System →](AI_CHAT_UI_SPEC.md)

---

## 🔒 Security & Compliance

### HIPAA Compliance Measures

✅ **Technical Safeguards**
- End-to-end encryption (TLS 1.3, AES-256)
- Multi-factor authentication (TOTP)
- Role-based access control (4 roles)
- Session timeout (15 minutes idle)
- Automated security scanning

✅ **Audit & Logging**
- Immutable audit trails (blockchain-style hash chaining)
- All PHI access logged with timestamp, user, IP
- 100% log integrity verification
- Tamper detection alerts

✅ **Data Protection**
- Data minimization (collect only essential PHI)
- Pseudonymization for analytics
- Secure data deletion protocols
- Business Associate Agreement with OpenAI

[Detailed Security Architecture →](MEDICAL_CONTROL_PLANE.md#security--hipaa-compliance)

---

## 🧪 Testing

```bash
# Frontend tests
npm run test
npm run test:coverage

# Backend tests
cd backend
npm run test           # Unit tests
npm run test:e2e       # Integration tests
npm run test:cov       # Coverage report

# E2E tests (Playwright)
npm run test:e2e:ui
```

---

## 📦 Building & Deployment

### Web (Production Build)
```bash
npm run build                  # Builds to dist/
npm run backend:build          # Compiles TypeScript
npm run backend:start          # Runs production server on port 8000
```

### Android APK
```bash
npm run android-debug          # Development APK
npm run android-release        # Signed release APK
```

### Docker
```bash
docker-compose up --build      # Full stack (frontend + backend + DB)
```

[Deployment Guide →](PROJECT_SPEC.md#deployment-strategy)

---

## 📊 Project Status

### Current Phase: **Active Development** (v1.0.0)

#### ✅ Completed
- [x] Core chat interface with streaming responses
- [x] JWT + OAuth authentication (Google, LinkedIn)
- [x] 17 clinical tools integrated
- [x] Basic audit logging
- [x] Android APK build pipeline
- [x] Design system implementation
- [x] Single-port serving (Nest + static frontend)

#### 🚧 In Progress
- [ ] Medical Control Plane implementation
- [ ] RAG engine with vector database
- [ ] Advanced intent classification (NLU)
- [ ] Emergency detection & escalation
- [ ] Complete HIPAA audit documentation

#### 📅 Roadmap
- **Q1 2026**: RAG engine + Medical Control Plane MVP
- **Q2 2026**: HIPAA certification audit
- **Q3 2026**: Institutional pilot deployments
- **Q4 2026**: General availability + iOS launch

[Implementation Timeline →](MEDICAL_CONTROL_PLANE.md#implementation-roadmap)

---

## 🤝 Contributing

We welcome contributions from healthcare professionals, developers, and security experts!

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Commit changes (`git commit -m 'feat(clinical): add GCS calculator'`)
4. Push to branch (`git push origin feature/amazing-tool`)
5. Open a Pull Request

### Code Standards
- **Frontend**: ESLint + Prettier
- **Backend**: TSLint + Prettier
- **Commits**: Conventional Commits format
- **Tests**: Required for new features

---

## 📜 License

**Proprietary** - © 2026 CareDroid Team. All rights reserved.

This is commercial software for healthcare institutions. Contact [team@caredroid.com](mailto:team@caredroid.com) for licensing inquiries.

---

## 📞 Support & Contact

- **Email**: [team@caredroid.com](mailto:team@caredroid.com)
- **Documentation**: [docs.caredroid.com](https://docs.caredroid.com)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-org/care-droid-app/issues)
- **Security Issues**: [security@caredroid.com](mailto:security@caredroid.com) (PGP key available)

---

## 🙏 Acknowledgments

Built with:
- [OpenAI GPT-4](https://openai.com) - Language model foundation
- [NestJS](https://nestjs.com) - Backend framework
- [React](https://react.dev) - Frontend library
- [PostgreSQL](https://www.postgresql.org) - Database
- [Capacitor](https://capacitorjs.com) - Mobile framework

Special thanks to healthcare professionals who provided clinical guidance and feedback.

---

<div align="center">

**Made with ❤️ for Healthcare Professionals**

[⬆ Back to Top](#caredroid---clinical-ai-co-pilot)

</div>
