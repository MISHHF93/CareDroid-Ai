# System Architecture & Wiring Guide

This document describes how all components of CareDroid-AI are wired together.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CareDroid-AI System                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Frontend   │◄────►│   Backend    │◄────►│ Database  │ │
│  │  (React/Vite)│      │  (NestJS)    │      │(PostgreSQL│ │
│  │   Port 8000  │      │  Port 3000   │      │ Port 5432 │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                            │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Firebase   │      │    Redis     │                    │
│  │    Auth      │      │   Cache      │                    │
│  │  Realtime DB │      │  Port 6379   │                    │
│  └──────────────┘      └──────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Connections

### 1. Frontend → Backend API

**Configuration:** [vite.config.js](vite.config.js)

```javascript
server: {
  port: 8000,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
    '/socket.io': {
      target: 'http://localhost:3000',
      ws: true,
    },
  },
}
```

**Frontend Service:** [src/config/appConfig.js](src/config/appConfig.js)

```javascript
api: {
  baseUrl: process.env.VITE_API_URL || 'http://localhost:3000',
  wsUrl: process.env.VITE_WS_URL || 'ws://localhost:3000',
}
```

**API Calls:** Services in [src/services/](src/services/)
- `authService.js` - Authentication API calls
- `chatService.js` - Chat/messaging
- `patientService.js` - Patient data
- `clinicalService.js` - Clinical operations

### 2. Backend → Database

**Configuration:** [backend/src/config/database.config.ts](backend/src/config/database.config.ts)

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'caredroid',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
})
```

**Entities:** [backend/src/modules/*/entities/](backend/src/modules/)
- User entity
- Patient entity
- Message entity
- Audit entity
- etc.

### 3. Backend → Redis Cache

**Configuration:** [backend/src/config/redis.config.ts](backend/src/config/redis.config.ts)

```typescript
{
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
}
```

**Usage:**
- Session storage
- Rate limiting
- Cache layer for DB queries
- Real-time data sync

### 4. Frontend → Firebase

**Services:**
- Authentication
- Push notifications
- Real-time database (optional)
- Cloud messaging

**Configuration:** Environment variables in `.env`

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
VITE_FIREBASE_VAPID_KEY=vapid-key
```

**Initialization:** [src/main.jsx](src/main.jsx)

### 5. Backend → Firebase Admin

**Configuration:** [backend/src/config/firebase.config.ts](backend/src/config/firebase.config.ts)

```typescript
firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})
```

**Usage:**
- Verify ID tokens from frontend
- Send push notifications
- Manage user auth states

### 6. Mobile App (Capacitor) → Web Assets

**Configuration:** [capacitor.config.json](capacitor.config.json)

```json
{
  "appId": "com.caredroid.clinical",
  "appName": "CareDroid",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

**Build Process:**
1. Frontend builds to `dist/` directory
2. Capacitor syncs `dist/` to native platform
3. Native wrapper loads web assets
4. JavaScript Bridge enables native features

**Sync Command:**
```bash
npm run build
npx cap sync android
```

## Data Flow Examples

### User Authentication Flow

```
┌─────────┐    1. Login     ┌──────────┐   2. Verify   ┌──────────┐
│ Frontend│ ───────────────►│ Firebase │──────────────►│ Backend  │
│         │                  │   Auth   │               │          │
│         │◄────────────────│          │◄──────────────│          │
└─────────┘  5. JWT Token   └──────────┘ 4. Create JWT └──────────┘
                                                │
                                         3. Check User
                                                │
                                                ▼
                                         ┌──────────┐
                                         │PostgreSQL│
                                         └──────────┘
```

### Chat Message Flow

```
┌─────────┐  1. Send Message  ┌──────────┐  2. Process  ┌──────────┐
│ Frontend│ ─────────────────►│ Backend  │─────────────►│   AI     │
│         │                    │          │              │  Engine  │
│         │◄──────────────────│          │◄─────────────│          │
└─────────┘  4. AI Response   └──────────┘  3. Generate └──────────┘
                                     │
                              Store Messages
                                     │
                                     ▼
                              ┌──────────┐
                              │PostgreSQL│
                              └──────────┘
```

### Offline Sync Flow

```
Frontend (Offline)
     │
     │ 1. Store in IndexedDB
     │
     ▼
┌──────────┐
│  Dexie   │
│ IndexedDB│
└──────────┘
     │
     │ 2. Network Available
     │
     ▼
Backend API
     │
     │ 3. Sync to Server
     │
     ▼
┌──────────┐
│PostgreSQL│
└──────────┘
```

## Environment Variables

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=

# Features
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CRASH_REPORTING=true
```

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=caredroid

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI Services
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX=
```

## Service Dependencies

### Startup Order

1. **PostgreSQL** - Must be running first
2. **Redis** - Required for backend caching
3. **Backend** - Starts after DB is ready
4. **Frontend** - Can start independently (proxies to backend)

### Docker Compose Orchestration

See [deployment/docker/docker-compose.yml](deployment/docker/docker-compose.yml)

```yaml
services:
  postgres:
    # Primary database
    
  redis:
    # Cache layer
    depends_on:
      - postgres
      
  backend:
    # API server
    depends_on:
      - postgres
      - redis
      
  frontend:
    # Web application
    # Independent of backend for development
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/history/:conversationId` - Get chat history
- `WebSocket /socket.io` - Real-time messaging

### Clinical
- `GET /api/clinical/patients` - List patients
- `GET /api/clinical/patients/:id` - Get patient details
- `POST /api/clinical/assessments` - Create assessment
- `GET /api/clinical/vitals/:patientId` - Get vital signs

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `POST /api/analytics/track` - Track event

## Testing Connections

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Database connection
curl http://localhost:3000/health/db

# Redis connection
curl http://localhost:3000/health/redis
```

### Route Testing

```bash
# Run comprehensive route test
node tests/frontend/test-routes.js

# Check all API endpoints
curl http://localhost:3000/api
```

### Integration Testing

```bash
# Full integration test suite
npm run test:e2e

# Backend integration tests
cd backend && npm run test:e2e
```

## Monitoring & Observability

### Metrics (Prometheus)
- **URL:** http://localhost:9090
- **Metrics:** API latency, error rates, resource usage
- **Config:** [config/prometheus/prometheus.yml](config/prometheus/prometheus.yml)

### Dashboards (Grafana)
- **URL:** http://localhost:3001
- **Dashboards:** Pre-configured in [config/grafana/](config/grafana/)

### Logs (Elasticsearch + Kibana)
- **Kibana URL:** http://localhost:5601
- **Log aggregation:** Via Logstash
- **Config:** [config/logstash.conf](config/logstash.conf)

## Troubleshooting

### Connection Issues

**Frontend can't reach backend:**
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check proxy configuration
cat vite.config.js | grep proxy
```

**Backend can't connect to database:**
```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Check environment variables
env | grep DATABASE_

# Check backend logs
cd backend && npm run start:dev
```

**Redis connection errors:**
```bash
# Test Redis
redis-cli ping

# Should return: PONG
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000  # Backend
lsof -i :8000  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

## Development Workflow

1. **Start services:**
   ```bash
   # Option 1: Everything together
   npm run start:all
   
   # Option 2: Separately
   cd backend && npm run start:dev  # Terminal 1
   npm run dev                       # Terminal 2
   ```

2. **Make changes:**
   - Frontend: Hot reload automatically
   - Backend: Nest watches for changes

3. **Test:**
   ```bash
   npm run test                # Frontend tests
   cd backend && npm run test  # Backend tests
   ```

4. **Build:**
   ```bash
   npm run build              # Frontend production build
   cd backend && npm run build # Backend production build
   ```

## Production Deployment

See [deployment/README.md](deployment/README.md) for comprehensive deployment guide.

### Quick Deploy

```bash
# Build all
npm run build
cd backend && npm run build

# Deploy with Docker
cd deployment/docker
docker-compose up -d
```

---

**Last Updated:** February 2026  
**Maintained by:** CareDroid DevOps Team
