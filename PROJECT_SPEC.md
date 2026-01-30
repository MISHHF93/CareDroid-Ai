# CareDroid Project Specification

> **Version:** 1.0.0  
> **Last Updated:** January 30, 2026  
> **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Design System](#design-system)
5. [Features & Capabilities](#features--capabilities)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Structure](#api-structure)
8. [Database Models](#database-models)
9. [Security & Compliance](#security--compliance)
10. [Development Workflow](#development-workflow)
11. [Deployment Strategy](#deployment-strategy)
12. [Mobile (Android)](#mobile-android)

---

## Project Overview

### Purpose
CareDroid is a HIPAA-compliant clinical AI assistant platform that empowers healthcare professionals with intelligent conversational AI and evidence-based clinical decision support tools. The platform combines OpenAI's GPT models with a sophisticated **Medical Control Plane**—a middleware layer that performs real-time intent classification, knowledge retrieval, and clinical tool orchestration—creating a seamless conversational experience where clinical tools and evidence-based protocols are dynamically surfaced within the chat flow.

**See [MEDICAL_CONTROL_PLANE.md](MEDICAL_CONTROL_PLANE.md) for detailed architecture.**

### Core Value Propositions
- **Intelligent Clinical Cockpit**: Natural language interface with proactive tool suggestion and in-chat clinical calculators
- **Evidence-Based Grounding**: RAG-powered retrieval of medical literature, protocols, and institutional guidelines
- **Security-First, HIPAA-By-Design**: Every component architected with encryption, audit logging, and access controls as foundational requirements
- **Emergency Detection**: Real-time identification of critical conditions with automatic escalation protocols
- **Modular Service Architecture**: Independent clinical tool microservices for reliability and scalability
- **Multi-Platform**: Web, Android (Capacitor), with iOS capability

### Target Users
- **Primary**: Physicians, nurses, pharmacists in hospital settings (ED, ICU, primary care)
- **Secondary**: Medical students, clinical researchers, healthcare administrators
- **Enterprise**: Healthcare systems requiring multi-tenant deployments

---

## Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │   Android    │  │   iOS (TBD)  │      │
│  │ (React/Vite) │  │ (Capacitor)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                    HTTPS/TLS 1.3 + WAF
                           │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        NestJS Backend (Node.js)                      │   │
│  │  • JWT Authentication + MFA                          │   │
│  │  • Rate Limiting & Throttling                        │   │
│  │  • CORS & Helmet Security                            │   │
│  │  • Immutable Audit Logging (Every Action)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           🧠 MEDICAL CONTROL PLANE 🧠                        │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Intent Classifier (NLU)                          │     │
│  │  • Detects tool requests in natural language     │     │
│  │  • Routes to appropriate clinical service         │     │
│  │  • Emergency keyword detection & escalation      │     │
│  └───────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────┐     │
│  │  RAG Engine (Vector DB + Medical Knowledge)      │     │
│  │  • Retrieves relevant protocols & guidelines      │     │
│  │  • Grounds AI responses in evidence               │     │
│  │  • Institutional knowledge base                   │     │
│  └───────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Clinical Tool Orchestrator                       │     │
│  │  • Executes calculators, drug checks, protocols   │     │
│  │  • Formats results for in-chat presentation       │     │
│  │  • Maintains conversation context                 │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┬───────────────┐
          │                │                │               │
          ▼                ▼                ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐
│  PostgreSQL  │  │    Redis     │  │   OpenAI     │  │ Vector  │
│   Database   │  │    Cache     │  │     API      │  │   DB    │
│ (Encrypted)  │  │   Sessions   │  │   GPT-4/3.5  │  │ (RAG)   │
└──────────────┘  └──────────────┘  └──────────────┘  └─────────┘
```

### Application Layers

#### Frontend (React SPA)
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite 5 (fast HMR, optimized production builds)
- **Routing**: React Router v6 (declarative routing, nested routes)
- **State Management**: React useState/useEffect (local state), context for auth
- **Styling**: CSS-in-JS (inline styles) + CSS variables for theming
- **API Client**: Native Fetch API with JSON

**Key Directories**:
```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Design system primitives (Button, Card, Input)
│   ├── ChatInterface.jsx
│   ├── Sidebar.jsx
│   ├── ToolPanel.jsx
│   └── Toast.jsx
├── layout/              # Shell components
│   ├── AuthShell.jsx    # Unauthenticated layout
│   └── AppShell.jsx     # Authenticated layout
├── pages/               # Route pages
│   ├── Auth.jsx
│   ├── Onboarding.jsx
│   ├── Settings.jsx
│   └── Profile.jsx
├── data/                # Static data
│   └── featureInventory.js
├── App.jsx              # Root component & routing
└── index.css            # Global styles & design tokens
```

#### Backend (NestJS)
- **Framework**: NestJS 10 (TypeScript, dependency injection, modules)
- **Runtime**: Node.js (LTS)
- **Architecture**: Modular monolith with service-oriented design

**Module Structure**:
```
backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap & middleware
├── config/                    # Configuration services
│   ├── auth.config.ts
│   ├── database.config.ts
│   ├── openai.config.ts
│   └── redis.config.ts
└── modules/
    ├── auth/                  # Authentication & OAuth
    ├── users/                 # User management
    ├── chat/                  # AI chat & message handling
    ├── ai/                    # OpenAI integration
    ├── clinical/              # Clinical tools & calculators
    ├── analytics/             # Event tracking
    ├── audit/                 # Compliance logging
    ├── subscriptions/         # Stripe billing
    ├── two-factor/            # 2FA (TOTP)
    └── compliance/            # HIPAA audit trails
```

#### Database (PostgreSQL)
- **ORM**: TypeORM (declarative entities, migrations)
- **Schema**: Multi-tenant ready with organization/tenant isolation
- **Indexes**: Optimized for conversation retrieval and audit queries

#### Cache (Redis)
- **Use Cases**: Session storage, rate limiting, temporary tokens
- **TTL Management**: Auto-expiring keys for magic links, OTP codes

---

## Technology Stack

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.3",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.0.11",
  "@capacitor/core": "^5.6.0",
  "@capacitor/android": "^5.6.0"
}
```

### Backend Dependencies
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/typeorm": "^10.0.1",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "typeorm": "^0.3.17",
  "pg": "^8.11.3",
  "redis": "^4.6.12",
  "openai": "^4.20.1",
  "passport-google-oauth20": "^2.0.0",
  "passport-linkedin-oauth2": "^2.0.0",
  "bcrypt": "^5.1.1",
  "stripe": "^14.10.0",
  "helmet": "^7.1.0",
  "winston": "^3.11.0"
}
```

### Build & Development Tools
- **Package Manager**: npm
- **Linting**: ESLint (React, TypeScript)
- **Formatting**: Prettier
- **Testing**: Jest (backend), React Testing Library (frontend)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (error tracking)

---

## Design System

### Vision
Modern SaaS aesthetic with clinical professionalism. Soft, premium feel with high contrast for accessibility, subtle depth through shadows and translucent surfaces.

### Design Tokens

#### Typography Scale
```css
--text-xs: 12px     /* Labels, captions */
--text-sm: 14px     /* Body text, buttons */
--text-base: 16px   /* Default paragraph */
--text-lg: 18px     /* Subheadings */
--text-xl: 22px     /* Headings */
--text-2xl: 28px    /* Page titles */
--text-3xl: 36px    /* Hero text */
```

#### Spacing Scale
```css
--space-2xs: 4px
--space-xs: 8px
--space-sm: 12px
--space-md: 16px
--space-lg: 20px
--space-xl: 24px
--space-2xl: 32px
--space-3xl: 48px
```

#### Border Radius
```css
--radius-sm: 8px     /* Small buttons, tags */
--radius-md: 12px    /* Cards, inputs */
--radius-lg: 16px    /* Panels */
--radius-xl: 24px    /* Hero cards */
```

#### Colors (Dark Theme)
```css
/* Backgrounds */
--navy-bg: #0b1220           /* Deep space background */
--navy-ink: #0b1220          /* High contrast text base */
--surface-glass: rgba(255, 255, 255, 0.04)  /* Translucent cards */
--surface-hover: rgba(255, 255, 255, 0.1)
--surface-hover-subtle: rgba(255, 255, 255, 0.05)

/* Text */
--text-primary: #f8fafc      /* High contrast white */
--text-secondary: #cbd5e1    /* Slightly muted */
--text-muted: rgba(248, 250, 252, 0.6)
--text-disabled: rgba(248, 250, 252, 0.3)

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.12)
--border-strong: rgba(255, 255, 255, 0.24)

/* Accents */
--accent-cyan: #00FFFF       /* Electric cyan */
--accent-green: #00FF88      /* Medical green */
--gradient-accent: linear-gradient(135deg, #00FF88, #00FFFF)

/* Status Colors */
--success: #00FF88
--error: #FF6B6B
--warning: #FFD166
--info: #00FFFF
```

#### Shadows
```css
--shadow-1: 0 8px 24px rgba(2, 6, 23, 0.25)   /* Subtle elevation */
--shadow-2: 0 14px 40px rgba(2, 6, 23, 0.35)  /* Medium depth */
--shadow-3: 0 24px 64px rgba(2, 6, 23, 0.45)  /* Strong lift */
```

### UI Components

#### Button
```jsx
<Button>Primary Action</Button>
<Button variant="ghost">Secondary</Button>
<Button disabled>Disabled</Button>
```
**Variants**: primary (gradient), ghost (outline), icon-only

#### Card
```jsx
<Card>Content with translucent background</Card>
<Card hover>Interactive card with hover state</Card>
```
**Features**: Glass morphism, subtle borders, shadow elevation

#### Input
```jsx
<Input placeholder="Email address" type="email" />
<Input error="Invalid format" />
```
**States**: default, focus (cyan border), error (red border), disabled

### Layout Grid
- **Sidebar Width**: 280px (fixed)
- **Header Height**: 72px (fixed)
- **Chat Max Width**: 960px (centered)
- **Card Max Width**: 720px (forms/settings)
- **Mobile Breakpoint**: 1024px

---

## Features & Capabilities

### Clinical Tools (In-Chat Only)

#### 1. Drug Interactions Checker
- **ID**: `drug-interactions`
- **Icon**: 💊
- **Prompt**: "Check interactions between warfarin and aspirin"
- **Backend**: AI-powered analysis with OpenAI + medical knowledge base

#### 2. Medical Calculators
- **ID**: `calculators`
- **Icon**: 🧮
- **Supported**: SOFA, APACHE II, CHA2DS2-VASc, GFR, BMI, BSA
- **Example Prompt**: "Calculate SOFA score for: PaO2/FiO2 180, platelets 90..."
- **Output**: Structured score with interpretation

#### 3. Clinical Protocols
- **ID**: `protocols`
- **Icon**: 📋
- **Coverage**: Sepsis, ACLS, stroke, trauma
- **Example**: "Summarize sepsis protocol for ED"

#### 4. Lab Interpreter
- **ID**: `lab-interpreter`
- **Icon**: 🧪
- **Input**: Comma-separated lab values
- **Output**: Interpretation + clinical significance

#### 5. Differential Diagnosis Generator
- **ID**: `diagnosis`
- **Icon**: 🔍
- **Input**: Chief complaint + symptoms
- **Output**: Prioritized DDx with likelihood

#### 6. Procedure Guides
- **ID**: `procedures`
- **Icon**: ⚕️
- **Examples**: Central line, intubation, lumbar puncture
- **Format**: Step-by-step with safety checks

### Platform Features

#### AI Workflow Assistant
- Guided checklists and workflows
- Context-aware suggestions
- Multi-step clinical reasoning

#### Audit Logging
- HIPAA-compliant access trails
- User action tracking
- PHI access logs

#### Offline Access
- Critical calculators available offline (Progressive Web App)
- Service worker caching
- Sync on reconnect

#### FHIR/HL7/DICOM Integration
- Standards-based data ingestion
- EHR interoperability
- Imaging system connectivity

#### Custom Branding
- White-labeling for institutions
- Logo, colors, domain customization
- Multi-tenant isolation

#### SSO/SAML
- Enterprise single sign-on
- SAML 2.0, OAuth 2.0, OpenID Connect
- Active Directory, Okta, Azure AD

#### Team Management
- Role-based access control (RBAC)
- Admin, clinician, viewer roles
- Organization hierarchy

---

## Authentication & Authorization

### Authentication Methods

#### 1. Email/Password (Direct Sign-In)
- Bcrypt hashed passwords (salt rounds: 12)
- JWT tokens (HS256, 24hr expiry)
- Refresh tokens stored in Redis (7-day TTL)

#### 2. Magic Link (Institutional Email)
- Passwordless email flow
- Token expiry: 15 minutes
- One-time use enforcement

#### 3. OAuth 2.0 (Social Login)
- **Google**: `passport-google-oauth20`
- **LinkedIn**: `passport-linkedin-oauth2`
- Callback route: `/api/auth/:provider/callback`

#### 4. SSO/SAML (Enterprise)
- SAML 2.0 assertion handling
- Identity provider metadata configuration
- Attribute mapping (email, name, role)

### Authorization Model

#### User Roles
```typescript
enum UserRole {
  ADMIN = 'admin',           // Full system access
  CLINICIAN = 'clinician',   // Clinical tools + patient data
  VIEWER = 'viewer',         // Read-only access
  STUDENT = 'student'        // Limited clinical tools
}
```

#### JWT Structure
```json
{
  "sub": "user-uuid",
  "email": "doctor@hospital.org",
  "role": "clinician",
  "orgId": "org-uuid",
  "iat": 1738252800,
  "exp": 1738339200
}
```

### Security Flows

#### Login Flow
```
1. User enters email/password at /auth
2. POST /api/auth/login → validate credentials
3. Backend generates JWT + refresh token
4. Frontend stores token in localStorage (AUTH_TOKEN_KEY)
5. Redirect to / (AuthShell → AppShell)
```

#### Protected Routes
```jsx
<Route element={<AppShell isAuthed={!!authToken} />}>
  <Route path="/" element={<ChatInterface />} />
  <Route path="/settings" element={<Settings />} />
</Route>
```
- If `!authToken`, AppShell redirects to `/auth`

---

## API Structure

### Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: `https://api.caredroid.com/api`

### Endpoints

#### Authentication
```
POST   /api/auth/register              # Create account
POST   /api/auth/login                 # Email/password login
POST   /api/auth/logout                # Invalidate token
POST   /api/auth/magic-link            # Send magic link
POST   /api/auth/verify-magic-link     # Verify token
GET    /api/auth/google                # Initiate Google OAuth
GET    /api/auth/google/callback       # OAuth callback
GET    /api/auth/linkedin              # Initiate LinkedIn OAuth
GET    /api/auth/linkedin/callback     # OAuth callback
```

#### Chat
```
POST   /api/chat/message               # Send message, get AI response
GET    /api/chat/conversations         # List user conversations
POST   /api/chat/conversations         # Create new conversation
GET    /api/chat/conversations/:id     # Get conversation messages
DELETE /api/chat/conversations/:id     # Delete conversation
```

#### Users
```
GET    /api/users/me                   # Current user profile
PATCH  /api/users/me                   # Update profile
POST   /api/users/me/avatar            # Upload avatar
```

#### Analytics
```
POST   /api/analytics/track            # Track user event
POST   /api/analytics/crash            # Report client-side crash
```

#### Health
```
GET    /health                         # System health check
```

### Request/Response Examples

#### POST /api/chat/message
**Request**:
```json
{
  "conversationId": "conv-uuid",
  "content": "Calculate SOFA score for: PaO2/FiO2 180, platelets 90",
  "sessionId": "session-uuid"
}
```

**Response**:
```json
{
  "role": "assistant",
  "content": "SOFA Score: 8\n\nBreakdown:\n- Respiration (PaO2/FiO2 180): 2 points...",
  "timestamp": "2026-01-30T12:34:56Z",
  "metadata": {
    "model": "gpt-4",
    "tokens": 245
  }
}
```

---

## Database Models

### User
```typescript
@Entity()
class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ default: 'clinician' })
  role: UserRole;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  professionalRole: string; // RN, MD, PharmD

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Conversation
```typescript
@Entity()
class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  title: string;

  @OneToMany(() => Message, msg => msg.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Message
```typescript
@Entity()
class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation)
  conversation: Conversation;

  @Column()
  role: 'user' | 'assistant' | 'system';

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  metadata: object;

  @CreateDateColumn()
  timestamp: Date;
}
```

### AuditLog
```typescript
@Entity()
class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  action: string; // 'login', 'view_conversation', 'export_data'

  @Column({ nullable: true })
  resourceType: string;

  @Column({ nullable: true })
  resourceId: string;

  @Column('jsonb', { nullable: true })
  metadata: object;

  @Column('inet', { nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  timestamp: Date;
}
```

---

## Security & Compliance

### HIPAA Compliance

#### Core Principles: "Security-First, HIPAA-By-Design"

CareDroid is architected with security and compliance as foundational requirements, not afterthoughts:

1. **Zero Trust Architecture**: Every request authenticated, authorized, and logged
2. **Data Minimization**: Only essential PHI collected and processed
3. **Encryption Everywhere**: TLS 1.3 in transit, AES-256 at rest
4. **Immutable Audit Trails**: Blockchain-style hash chaining prevents log tampering
5. **Fail-Safe Defaults**: System defaults to most restrictive permissions

**See [MEDICAL_CONTROL_PLANE.md](MEDICAL_CONTROL_PLANE.md#security--hipaa-compliance) for comprehensive security architecture.**

#### Technical Safeguards
- **Encryption in Transit**: TLS 1.3 (HTTPS only)
- **Encryption at Rest**: PostgreSQL encryption, encrypted backups
- **Access Controls**: RBAC, MFA for admin accounts
- **Audit Trails**: All PHI access logged (AuditLog table)
- **Session Management**: 15-minute idle timeout, secure cookies

#### Administrative Safeguards
- **Security Policies**: Written HIPAA compliance documentation
- **Training**: Required for all team members with PHI access
- **Business Associate Agreements**: OpenAI BAA in place
- **Risk Assessment**: Annual security audits

#### Physical Safeguards
- **Data Centers**: SOC 2 Type II compliant hosting (AWS/GCP)
- **Backup**: Automated daily backups, 30-day retention
- **Disaster Recovery**: RTO 4 hours, RPO 1 hour

### Application Security

#### Input Validation
```typescript
// All DTOs validated with class-validator
class SendMessageDto {
  @IsString()
  @MaxLength(10000)
  content: string;

  @IsUUID()
  conversationId: string;
}
```

#### Rate Limiting
```typescript
// Global rate limit: 100 requests/15min
@UseGuards(ThrottlerGuard)
@Throttle(100, 900)
```

#### SQL Injection Prevention
- TypeORM parameterized queries (no raw SQL)
- Input sanitization via class-validator

#### XSS Prevention
- React automatic escaping
- Content-Security-Policy headers via Helmet

#### CSRF Protection
- SameSite cookies
- JWT in Authorization header (not cookies)

---

## Development Workflow

### Local Setup

#### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 6+
- npm or yarn

#### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/caredroid
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-256-bit-key>
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

#### Running Locally
```bash
# Terminal 1: Backend
cd backend
npm install
npm run start:dev  # Port 3000

# Terminal 2: Frontend
npm install
npm run dev        # Port 8000 (proxies API to 3000)

# Or combined:
npm run start:all
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/new-calculator
git commit -m "feat(clinical): add GCS calculator"
git push origin feature/new-calculator

# Pull request → main
# Automated CI checks (lint, test, build)
```

### Testing Strategy

#### Frontend Tests
```bash
npm run test              # Jest + React Testing Library
npm run test:coverage     # Coverage report
```

#### Backend Tests
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # Integration tests
npm run test:cov          # Coverage
```

#### E2E Tests
- Playwright for full user flows (login → chat → logout)
- Run in CI pipeline before deployment

---

## Deployment Strategy

### Containerization

#### Frontend (Static Hosting)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

#### Backend (Node.js API)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Production Architecture

#### Single-Port Serving (Current)
- NestJS serves both API (`/api/*`) and static frontend (`/*`)
- Port 8000 unified access
- ServeStaticModule configured in `app.module.ts`

#### Scalable Architecture (Future)
```
            ┌─────────────┐
            │   Cloudflare│
            │     CDN     │
            └─────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐       ┌──────▼──────┐
    │  S3 +   │       │ Load Balancer│
    │CloudFront│       │   (ALB)      │
    │Frontend │       └──────┬───────┘
    └─────────┘              │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐    ┌─────▼─────┐
              │  NestJS   │    │  NestJS   │
              │  Instance │    │  Instance │
              └─────┬─────┘    └─────┬─────┘
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   RDS PostgreSQL│
                    │  + ElastiCache  │
                    └─────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Frontend
        run: npm ci && npm run build
      - name: Build Backend
        run: cd backend && npm ci && npm run build
      - name: Run Tests
        run: npm run test:all
      - name: Deploy to AWS
        run: ./scripts/deploy.sh
```

### Environment Stages
- **Development**: `localhost:8000` (local dev)
- **Staging**: `staging.caredroid.com` (pre-production testing)
- **Production**: `app.caredroid.com` (live)

---

## Mobile (Android)

### Capacitor Configuration

#### `capacitor.config.json`
```json
{
  "appId": "com.caredroid.app",
  "appName": "CareDroid",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0b1220"
    }
  }
}
```

### Build Process
```bash
# Development APK
npm run android-debug

# Production APK (signed)
npm run android-release
```

### Android-Specific Features
- **Offline Mode**: Service worker caches critical calculators
- **Push Notifications**: (Planned) Alert for critical updates
- **Biometric Auth**: (Planned) Fingerprint/Face ID for login

### Distribution
- **Internal Testing**: Firebase App Distribution
- **Production**: Google Play Store (Enterprise track)
- **Enterprise MDM**: Supports Silent Install for hospital fleets

---

## Appendices

### A. Environment Variables Reference

#### Backend Required
```
DATABASE_URL              # PostgreSQL connection string
REDIS_URL                 # Redis connection string
JWT_SECRET                # 256-bit secret for JWT signing
OPENAI_API_KEY            # OpenAI API key
PORT                      # Server port (default: 3000)
NODE_ENV                  # production | development | test
```

#### Backend Optional
```
GOOGLE_CLIENT_ID          # Google OAuth
GOOGLE_CLIENT_SECRET
LINKEDIN_CLIENT_ID        # LinkedIn OAuth
LINKEDIN_CLIENT_SECRET
STRIPE_API_KEY            # Billing (if enabled)
SENTRY_DSN                # Error tracking
SMTP_HOST                 # Email server
SMTP_USER
SMTP_PASS
```

### B. Key File Locations

#### Frontend
- **Entry Point**: `src/main.jsx`
- **Router**: `src/App.jsx`
- **Auth Shell**: `src/layout/AuthShell.jsx`
- **App Shell**: `src/layout/AppShell.jsx`
- **Chat UI**: `src/components/ChatInterface.jsx`
- **Feature Data**: `src/data/featureInventory.js`

#### Backend
- **Bootstrap**: `backend/src/main.ts`
- **App Module**: `backend/src/app.module.ts`
- **Chat Endpoint**: `backend/src/modules/chat/chat.controller.ts`
- **Auth Module**: `backend/src/modules/auth/`
- **OpenAI Service**: `backend/src/modules/ai/ai.service.ts`

### C. Useful Commands

```bash
# Development
npm run dev                    # Frontend dev server
npm run backend:dev            # Backend dev server
npm run start:all              # Run both concurrently

# Building
npm run build                  # Build frontend for production
npm run backend:build          # Build backend TypeScript

# Testing
npm run test                   # Frontend tests
cd backend && npm run test     # Backend tests

# Linting & Formatting
npm run lint                   # ESLint check
npm run format                 # Prettier format

# Android
npm run android-debug          # Build debug APK
npm run android-release        # Build signed release APK

# Database
cd backend
npm run migration:generate     # Generate migration
npm run migration:run          # Run migrations
npm run seed                   # Seed database
```

---

## Document History

| Version | Date          | Author         | Changes                          |
|---------|---------------|----------------|----------------------------------|
| 1.0.0   | Jan 30, 2026  | CareDroid Team | Initial comprehensive spec       |

---

**For questions or updates, contact:** [team@caredroid.com](mailto:team@caredroid.com)
