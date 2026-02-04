# 🚀 CareDroid-AI Quick Reference

**One-stop reference for developers**

## 📁 Project Structure

```
CareDroid-Ai/
├── src/                     # React frontend application
├── backend/                 # NestJS backend server
├── android/                 # Native Android (Capacitor)
├── tests/                   # All test files
│   ├── frontend/           # Frontend tests
│   ├── integration/        # Integration tests
│   └── tools/              # Test utilities
├── deployment/             # Deployment configs
│   ├── docker/            # Docker compose
│   └── android/           # Android build scripts
├── config/                 # Monitoring (Prometheus, Grafana)
├── scripts/                # Build utilities
├── docs/                   # Documentation archive
└── .debug-tools/          # Debug utilities
```

## ⚡ Quick Commands

### Development
```bash
npm run start:all          # Start frontend + backend
npm run dev                # Frontend only (port 8000)
npm run backend:dev        # Backend only (port 3000)
```

### Testing
```bash
npm run test               # Frontend tests
npm run test:coverage      # With coverage
cd backend && npm run test # Backend tests
node tests/frontend/test-routes.js  # Route health check
```

### Building
```bash
npm run build              # Frontend production build
cd backend && npm run build # Backend build
npm run android-debug      # Android debug APK
npm run android-release    # Android release APK
```

### Deployment
```bash
cd deployment/docker
docker-compose up -d       # Start all services

cd deployment/android
./build-android-apk.sh     # Build Android APK
```

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend Dev | http://localhost:8000 | React dev server |
| Backend API | http://localhost:3000 | NestJS API |
| API Health | http://localhost:3000/health | Health check |
| API Docs | http://localhost:3000/api | Swagger docs |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3001 | Dashboards |
| Kibana | http://localhost:5601 | Logs |

## 📦 Key Technologies

**Frontend:** React 18, Vite, React Router, Firebase, Dexie (IndexedDB)  
**Backend:** NestJS, TypeORM, PostgreSQL, Redis, Socket.io  
**Mobile:** Capacitor, Android SDK  
**AI:** OpenAI, Pinecone (Vector DB)  
**Monitoring:** Prometheus, Grafana, ELK Stack

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies & scripts |
| `backend/package.json` | Backend dependencies & scripts |
| `vite.config.js` | Frontend build & dev server |
| `capacitor.config.json` | Mobile app configuration |
| `deployment/docker/docker-compose.yml` | Service orchestration |
| `.env` | Environment variables (not in repo) |
| `.env.example` | Environment template |

## 🔑 Environment Setup

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_PROJECT_ID=your-project
```

### Backend (.env)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_PASSWORD=your-password
REDIS_HOST=localhost
JWT_SECRET=your-secret
OPENAI_API_KEY=your-key
```

## 📚 Documentation

- [README.md](README.md) - Main documentation
- [SYSTEM_WIRING.md](SYSTEM_WIRING.md) - Architecture & connections
- [tests/README.md](tests/README.md) - Testing guide
- [deployment/README.md](deployment/README.md) - Deployment guide
- [backend/README.md](backend/README.md) - Backend API docs
- [docs/archive/](docs/archive/) - Historical documentation

## 🐛 Debugging

### Check Service Status
```bash
# Backend health
curl http://localhost:3000/health

# Database
pg_isready -h localhost -p 5432

# Redis
redis-cli ping
```

### View Logs
```bash
# Backend logs
cd backend && npm run start:dev

# Docker logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Frontend console
# Open browser DevTools
```

### Debug Tools
```bash
# Open auth debug page
open .debug-tools/AUTH_DEBUG_TEST.html
```

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for secrets
- Backend enforces TLS in production
- HIPAA-compliant architecture
- RBAC for all endpoints

## 🚦 Common Issues

### Port already in use
```bash
lsof -i :8000  # Kill frontend
lsof -i :3000  # Kill backend
```

### Database connection failed
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check credentials in .env
env | grep DATABASE_
```

### Build failures
```bash
# Clear caches
rm -rf node_modules dist
npm install
npm run build
```

### Android build issues
```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

## 📱 Mobile Development

### Sync to Android
```bash
npm run build
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```

### Run on Device
```bash
npm run android-debug
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 🧪 Testing Strategy

- **Unit Tests:** Individual components/functions
- **Integration Tests:** Service interactions
- **E2E Tests:** Full user workflows
- **Route Tests:** Frontend routing integrity

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes & test
npm run test
git add .
git commit -m "feat: your feature"

# Push & create PR
git push origin feature/your-feature
```

## 📞 Support

- Check documentation in `docs/` directory
- Review archived guides in `docs/archive/`
- Check GitHub Issues
- Contact DevOps team for deployment issues

---

**Pro Tip:** Bookmark this file for quick reference during development!

**Version:** 1.0  
**Last Updated:** February 2026
