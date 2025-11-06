# 🚀 CareDroid Backend - Quick Start Guide

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** 18+ LTS ([download here](https://nodejs.org/))
- **PostgreSQL** 14+ ([download here](https://www.postgresql.org/download/))
- **Redis** 7+ ([download here](https://redis.io/download))

### Windows Quick Setup (Using Docker)

The easiest way to get PostgreSQL and Redis running on Windows is using Docker:

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Start Docker Desktop
3. Navigate to the backend directory and run:
   ```powershell
   docker-compose up -d
   ```

This will start PostgreSQL on port 5432 and Redis on port 6379.

---

## Installation Steps

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Configure Environment Variables

```powershell
# Copy the example environment file
cp .env.example .env

# Edit .env with your favorite editor
notepad .env
```

**Minimum required configuration:**

```env
# Database
DATABASE_PASSWORD=postgres

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Encryption Key (EXACTLY 32 characters!)
ENCRYPTION_KEY=your-32-character-encryption-key!
```

### 3. Start Database Services

**Option A: Using Docker (Recommended)**
```powershell
docker-compose up -d
```

**Option B: Local Installation**
- Ensure PostgreSQL is running on port 5432
- Ensure Redis is running on port 6379

### 4. Run Database Migrations

```powershell
npm run migration:run
```

### 5. Start Development Server

```powershell
npm run start:dev
```

The backend will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api

---

## Testing the API

### Register a New User

```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"doctor@test.com\",\"password\":\"SecurePass123!\",\"fullName\":\"Dr. Test\"}'
```

### Login

```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"doctor@test.com\",\"password\":\"SecurePass123!\"}'
```

### Get Current User

```powershell
curl -X GET http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Development Commands

```powershell
# Start in development mode (auto-reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Lint code
npm run lint

# Format code
npm run format
```

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                     # Application entry point
│   ├── app.module.ts               # Root module
│   ├── config/                     # Configuration files
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── stripe.config.ts
│   │   └── openai.config.ts
│   └── modules/
│       ├── auth/                   # Authentication module
│       ├── users/                  # User management
│       ├── subscriptions/          # Stripe integration
│       ├── two-factor/             # 2FA
│       ├── clinical/               # Clinical data
│       ├── ai/                     # OpenAI integration
│       ├── audit/                  # HIPAA audit logs
│       └── compliance/             # GDPR compliance
├── .env.example                    # Environment template
├── docker-compose.yml              # Local dev services
└── package.json
```

---

## Environment Variables Reference

### Critical Security Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-min-32-chars` |
| `ENCRYPTION_KEY` | AES-256 encryption key (32 chars) | `your-32-character-key-exactly!!` |
| `DATABASE_PASSWORD` | PostgreSQL password | `postgres` |
| `REDIS_PASSWORD` | Redis password | `redis_password` |

### OAuth Credentials

To enable Google/LinkedIn login, you'll need to:

1. **Google OAuth**: Create credentials at https://console.cloud.google.com/
2. **LinkedIn OAuth**: Create app at https://www.linkedin.com/developers/

### Stripe Configuration

1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API Keys
3. Create products and get Price IDs

### OpenAI Integration

1. Sign up at https://platform.openai.com
2. Generate API key
3. Add credits to your account

---

## Database Schema

The application uses the following tables:

- `users` - User accounts
- `user_profiles` - User profile information (encrypted)
- `oauth_accounts` - Google/LinkedIn OAuth links
- `two_factor_auth` - TOTP 2FA secrets
- `subscriptions` - Stripe subscription data
- `audit_logs` - HIPAA-compliant audit trail

---

## Troubleshooting

### Port Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Failed

```powershell
# Check if PostgreSQL is running
docker ps

# View PostgreSQL logs
docker logs caredroid-postgres

# Restart containers
docker-compose restart
```

### Redis Connection Failed

```powershell
# Check if Redis is running
docker ps

# Test Redis connection
docker exec -it caredroid-redis redis-cli ping
```

---

## Next Steps

1. ✅ Backend API running
2. 🔜 Configure OAuth providers
3. 🔜 Set up Stripe webhooks
4. 🔜 Connect frontend to backend
5. 🔜 Deploy to production

---

## Support

For issues or questions:
- Check the main README.md
- Review Swagger docs at http://localhost:3000/api
- Check PRODUCTION_ROADMAP.md for implementation details
