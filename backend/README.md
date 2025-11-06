# CareDroid Backend - NestJS + PostgreSQL + Redis

## 🏥 **HIPAA-Compliant Clinical Platform Backend**

Production-grade backend infrastructure for CareDroid Clinical Companion with:
- ✅ NestJS framework
- ✅ PostgreSQL with TypeORM
- ✅ Redis for sessions & caching
- ✅ Stripe payment processing
- ✅ OpenAI GPT-4 integration
- ✅ Multi-factor authentication
- ✅ HIPAA audit logging
- ✅ AES-256 encryption

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 7+
- Docker (optional, for local development)

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp ../.env.template .env

# Start PostgreSQL + Redis (Docker)
docker-compose up -d

# Run database migrations
npm run migration:run

# Seed initial data
npm run seed

# Start development server
npm run start:dev

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/api
```

---

## 📁 **Project Structure**

```
backend/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── config/                          # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── stripe.config.ts
│   │   └── openai.config.ts
│   │
│   ├── modules/
│   │   ├── auth/                        # Authentication & Authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── linkedin.strategy.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       ├── roles.guard.ts
│   │   │       └── subscription.guard.ts
│   │   │
│   │   ├── users/                       # User Management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── entities/
│   │   │       ├── user.entity.ts
│   │   │       ├── user-profile.entity.ts
│   │   │       └── oauth-account.entity.ts
│   │   │
│   │   ├── subscriptions/               # Stripe Integration
│   │   │   ├── subscriptions.module.ts
│   │   │   ├── subscriptions.controller.ts
│   │   │   ├── subscriptions.service.ts
│   │   │   ├── webhooks.controller.ts
│   │   │   └── entities/
│   │   │       └── subscription.entity.ts
│   │   │
│   │   ├── two-factor/                  # 2FA (TOTP)
│   │   │   ├── two-factor.module.ts
│   │   │   ├── two-factor.service.ts
│   │   │   └── entities/
│   │   │       └── two-factor.entity.ts
│   │   │
│   │   ├── clinical/                    # Clinical Data Entities
│   │   │   ├── drugs/
│   │   │   ├── protocols/
│   │   │   ├── lab-values/
│   │   │   └── procedures/
│   │   │
│   │   ├── ai/                          # OpenAI Integration
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   └── entities/
│   │   │       └── ai-query.entity.ts
│   │   │
│   │   ├── audit/                       # HIPAA Audit Logs
│   │   │   ├── audit.module.ts
│   │   │   ├── audit.service.ts
│   │   │   └── entities/
│   │   │       └── audit-log.entity.ts
│   │   │
│   │   └── compliance/                  # Compliance Controls
│   │       ├── compliance.module.ts
│   │       ├── compliance.service.ts
│   │       └── gdpr/
│   │           ├── export.service.ts
│   │           └── deletion.service.ts
│   │
│   ├── common/
│   │   ├── guards/                      # Shared guards
│   │   ├── decorators/                  # Custom decorators
│   │   ├── interceptors/                # Logging, encryption
│   │   ├── filters/                     # Exception filters
│   │   └── dto/                         # Base DTOs
│   │
│   └── database/
│       ├── migrations/                  # TypeORM migrations
│       └── seeds/                       # Initial data
│
├── test/                                # E2E tests
├── docker-compose.yml                   # Local dev environment
├── .env.template                        # Environment variables
└── README.md
```

---

## 🗄️ **Database Schema**

### Core Tables

**users**
- `id` (UUID, PK)
- `email` (encrypted)
- `password_hash` (bcrypt)
- `email_verified` (boolean)
- `is_active` (boolean)
- `created_at` / `updated_at`

**user_profiles**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `full_name` (encrypted)
- `institution` (encrypted)
- `role` (enum: physician, nurse, student)
- `specialty` (varchar)
- `license_number` (encrypted)
- `trust_score` (integer)
- `verified` (boolean)

**subscriptions**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `stripe_customer_id` (varchar)
- `stripe_subscription_id` (varchar)
- `tier` (enum: free, professional, institutional)
- `status` (enum: active, canceled, past_due)
- `current_period_end` (timestamp)

**audit_logs**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `action` (varchar)
- `resource` (varchar)
- `ip_address` (encrypted)
- `user_agent` (encrypted)
- `phi_accessed` (boolean)
- `timestamp` (timestamp with time zone)

---

## 🔐 **Security Features**

### Encryption
- **AES-256-GCM** for PII fields (name, email, license #)
- **Bcrypt** (12 rounds) for passwords
- **TLS 1.3** for all network traffic

### Authentication
- **JWT** access tokens (15 min expiry)
- **Refresh tokens** (30 day expiry, httpOnly cookie)
- **OAuth 2.0** (Google, LinkedIn)
- **TOTP** (6-digit codes, 30s window)

### Authorization
- **Role-Based Access Control** (RBAC)
- **Subscription Tier Guards**
- **Rate Limiting** (100 req/15min per IP)

### Compliance
- **HIPAA Audit Logging** (all PHI access)
- **GDPR Data Export** (JSON format)
- **Right to be Forgotten** (automated deletion)
- **Session Timeouts** (30 min idle, 8 hr absolute)

---

## 🧪 **Testing**

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

---

## 📦 **Deployment**

### Docker Production Build

```bash
# Build image
docker build -t caredroid-backend:latest .

# Run container
docker run -p 3000:3000 --env-file .env caredroid-backend:latest
```

### Environment Variables
See `.env.template` for all required variables

### Health Checks
- `GET /health` - Basic health check
- `GET /health/db` - Database connectivity
- `GET /health/redis` - Redis connectivity

---

## 📚 **API Documentation**

Swagger UI available at: **http://localhost:3000/api**

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - Email/password login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/google` - Google OAuth
- `GET /auth/linkedin` - LinkedIn OAuth

### Subscription Endpoints
- `GET /subscriptions/plans` - Available plans
- `POST /subscriptions/create-checkout` - Create Stripe Checkout Session
- `POST /subscriptions/portal` - Customer portal
- `POST /webhooks/stripe` - Stripe webhook handler

### AI Endpoints
- `POST /ai/query` - Generate clinical output
- `GET /ai/usage` - Monthly usage stats

---

## 📊 **Monitoring**

- **APM**: DataDog integration
- **Errors**: Sentry error tracking
- **Logs**: Winston with daily rotation
- **Metrics**: Prometheus endpoint at `/metrics`

---

## 🤝 **Contributing**

1. Create feature branch
2. Write tests
3. Run lint & format
4. Submit PR with description

---

## 📝 **License**

Proprietary - © 2025 CareDroid. All rights reserved.
