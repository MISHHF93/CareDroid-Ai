# CareDroid-AI

**Medical AI Clinical Co-Pilot Platform with Emergency Escalation & RBAC**

CareDroid-AI is a comprehensive healthcare platform that combines AI-powered clinical assistance with robust emergency escalation and role-based access control (RBAC).

## 🏗️ Project Structure

```
CareDroid-Ai/
├── src/                    # Frontend React application
├── backend/                # NestJS backend server
├── android/                # Native Android app (Capacitor)
├── config/                 # Monitoring configs (Prometheus, Grafana, etc.)
├── tests/                  # Organized test suite
│   ├── frontend/          # Frontend route and UI tests
│   ├── integration/       # Integration tests
│   └── tools/             # Test runner utilities
├── deployment/            # Deployment configurations
│   ├── docker/           # Docker compose and containers
│   └── android/          # Android build scripts
├── scripts/              # Build and utility scripts
└── .debug-tools/         # Debug utilities and test pages

```

## � Security Notice

**Port Policy:** This application is configured to run exclusively on port 8000. Any attempts to use other ports will be blocked at multiple levels:

- Backend startup validation
- Docker container configuration
- Development server restrictions
- Build-time checks

This is a security measure to prevent accidental exposure on non-standard ports.

## �🚀 Quick Start

### Development

```bash
# Install dependencies
npm install
cd backend && npm install

# Start application on unified port 8000
npm start                # Builds frontend and runs backend on port 8000 (recommended)
# OR
npm run start:all        # Same as above
npm run dev              # Same as above

# Or start backend only (still serves frontend on port 8000)
npm run backend:dev
```

### Testing

```bash
# Frontend tests
npm run test
npm run test:coverage

# Backend tests
cd backend
npm run test
npm run test:e2e

# Route health check
node tests/frontend/test-routes.js
```

### Building

```bash
# Frontend build
npm run build

# Backend build
cd backend && npm run build

# Android build
npm run android-debug
npm run android-release
```

## 📦 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Firebase** - Authentication & real-time features
- **Dexie** - IndexedDB wrapper for offline support

### Backend
- **NestJS** - Server framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & sessions
- **Firebase Admin** - Auth verification
- **Pinecone** - Vector database for RAG
- **Socket.io** - Real-time communication

### Mobile
- **Capacitor** - Native app wrapper
- **Android SDK** - Native Android features

## 🔧 Configuration

Key configuration files:
- `vite.config.js` - Frontend build and dev server
- `capacitor.config.json` - Mobile app configuration
- `backend/nest-cli.json` - Backend CLI settings
- `deployment/docker/docker-compose.yml` - Docker orchestration

## 📚 Documentation

For detailed documentation, see:
- Backend API docs: `backend/README.md`
- Android build guide: `deployment/android/README.md`
- Testing guide: `tests/README.md`

## 🔐 Security

- HIPAA-compliant architecture
- TLS encryption enforced
- Role-based access control (RBAC)
- Firebase authentication
- Secure session management

## 📱 Deployment

### Docker Deployment
```bash
cd deployment/docker
docker-compose up -d
```

### Android Release
```bash
cd deployment/android
./build-android-apk.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `npm run test`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## 📄 License

Proprietary - CareDroid Team

---

For quick reference guides, see individual directories' README files.
