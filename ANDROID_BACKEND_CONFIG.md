# Android-Specific Backend Configuration

## Overview
This document outlines backend configurations specifically for the native Android app, including API endpoints, authentication, and mobile-specific features.

---

## Backend API Endpoints

### Base URL Configuration

**Development:**
- Android Emulator: `http://10.0.2.2:8000`
- Physical Device: `http://<YOUR_IP>:8000`
- Production: `https://api.caredroid.ai`

**Android Configuration:**
```kotlin
// android/app/build.gradle
android {
    defaultConfig {
        buildConfigField "String", "API_BASE_URL", "\"${apiBaseUrl}\""
    }
}

// android/app/src/main/kotlin/.../di/NetworkModule.kt
@Provides
@Singleton
fun provideRetrofit(): Retrofit {
    return Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .client(okHttpClient)
        .build()
}
```

---

## API Endpoints Used by Android

### Authentication Endpoints
```
POST   /auth/login              - User login
POST   /auth/signup             - User registration
POST   /auth/logout             - User logout
POST   /auth/refresh            - Token refresh
GET    /auth/me                 - Current user info
POST   /auth/2fa/enable         - Enable 2FA
POST   /auth/2fa/verify         - Verify 2FA code
```

### Chat Endpoints
```
POST   /chat/message            - Send chat message
GET    /chat/conversations      - Get user conversations
GET    /chat/conversations/:id  - Get specific conversation
DELETE /chat/conversations/:id  - Delete conversation
POST   /chat/conversations      - Create new conversation
```

### Health Tools Endpoints
```
POST   /health/drug-checker     - Check drug interactions
POST   /health/lab-interpreter  - Interpret lab results
POST   /health/sofa-calculator  - Calculate SOFA score
POST   /health/emergency        - Emergency escalation
```

### User Profile Endpoints
```
GET    /users/profile           - Get user profile
PUT    /users/profile           - Update profile
GET    /users/settings          - Get user settings
PUT    /users/settings          - Update settings
```

### Push Notification Endpoints
```
POST   /notifications/register  - Register FCM token
DELETE /notifications/register  - Unregister FCM token
GET    /notifications/history   - Get notification history
```

---

## Android-Specific Headers

### Required Headers
```kotlin
// android/app/src/main/kotlin/.../data/remote/AuthInterceptor.kt
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${tokenManager.getAccessToken()}")
            .addHeader("Content-Type", "application/json")
            .addHeader("Accept", "application/json")
            .addHeader("X-Platform", "android")
            .addHeader("X-App-Version", BuildConfig.VERSION_NAME)
            .addHeader("X-Device-Id", getDeviceId())
            .build()
        
        return chain.proceed(request)
    }
}
```

### Backend Recognition
```typescript
// backend/src/middleware/platform.middleware.ts
export function PlatformMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const platform = req.headers['x-platform'] as string;
  const appVersion = req.headers['x-app-version'] as string;
  const deviceId = req.headers['x-device-id'] as string;
  
  req.platform = {
    type: platform || 'unknown',
    version: appVersion || 'unknown',
    deviceId: deviceId || 'unknown',
  };
  
  // Handle Android-specific logic
  if (platform === 'android') {
    // Enable Android-specific features
    req.features = {
      biometric: true,
      pushNotifications: true,
      offlineSync: true,
    };
  }
  
  next();
}
```

---

## Firebase Cloud Messaging (FCM)

### Backend FCM Configuration

**Environment Variables:**
```bash
# backend/.env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

**FCM Service:**
```typescript
// backend/src/modules/notifications/fcm.service.ts
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'caredroid_default',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };

    await admin.messaging().send(message);
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string
  ): Promise<void> {
    const message = {
      topic,
      notification: { title, body },
      android: {
        priority: 'high' as const,
      },
    };

    await admin.messaging().send(message);
  }
}
```

**Register Token Endpoint:**
```typescript
// backend/src/modules/notifications/notifications.controller.ts
@Controller('notifications')
export class NotificationsController {
  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerToken(
    @Body() dto: RegisterTokenDto,
    @CurrentUser() user: User
  ) {
    await this.notificationsService.registerToken(
      user.id,
      dto.fcmToken,
      'android'
    );
    return { success: true };
  }

  @Delete('register')
  @UseGuards(JwtAuthGuard)
  async unregisterToken(
    @CurrentUser() user: User
  ) {
    await this.notificationsService.unregisterToken(user.id);
    return { success: true };
  }
}
```

---

## Offline Sync Strategy

### Backend Sync Endpoint
```typescript
// backend/src/modules/sync/sync.controller.ts
@Controller('sync')
export class SyncController {
  @Post('messages')
  @UseGuards(JwtAuthGuard)
  async syncMessages(
    @Body() dto: SyncMessagesDto,
    @CurrentUser() user: User
  ) {
    // Accept batch of offline messages from Android
    const results = await this.syncService.processBatchMessages(
      user.id,
      dto.messages
    );
    
    return {
      success: true,
      processed: results.length,
      conflicts: results.filter(r => r.conflict),
    };
  }

  @Get('changes/:since')
  @UseGuards(JwtAuthGuard)
  async getChanges(
    @Param('since') since: string,
    @CurrentUser() user: User
  ) {
    // Return changes since timestamp for Android to sync
    const changes = await this.syncService.getChangesSince(
      user.id,
      new Date(since)
    );
    
    return {
      conversations: changes.conversations,
      messages: changes.messages,
      settings: changes.settings,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Conflict Resolution
```typescript
// backend/src/modules/sync/sync.service.ts
@Injectable()
export class SyncService {
  async processBatchMessages(
    userId: string,
    messages: OfflineMessage[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const message of messages) {
      try {
        // Check for conflicts (server-side changes)
        const conflict = await this.checkConflict(message);
        
        if (conflict) {
          // Last-write-wins strategy
          if (message.timestamp > conflict.timestamp) {
            await this.saveMessage(userId, message);
            results.push({ id: message.id, success: true, conflict: false });
          } else {
            results.push({ 
              id: message.id, 
              success: false, 
              conflict: true,
              serverVersion: conflict 
            });
          }
        } else {
          await this.saveMessage(userId, message);
          results.push({ id: message.id, success: true, conflict: false });
        }
      } catch (error) {
        results.push({ 
          id: message.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }
}
```

---

## Rate Limiting for Mobile

### Mobile-Specific Rate Limits
```typescript
// backend/src/config/rate-limit.config.ts
export const rateLimitConfig = {
  android: {
    chat: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 requests per minute
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 login attempts
    },
    healthTools: {
      windowMs: 60 * 1000,
      max: 30, // 30 requests per minute
    },
  },
  web: {
    // Different limits for web
    chat: {
      windowMs: 60 * 1000,
      max: 15,
    },
  },
};

// Apply platform-specific limits
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  @Post('message')
  @UseGuards(PlatformRateLimitGuard)
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
    @Platform() platform: string
  ) {
    // Rate limit applied based on platform
    return this.chatService.sendMessage(user.id, dto);
  }
}
```

---

## Security Configuration

### CORS for Android
```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:8000',      // Web dev
    'http://10.0.2.2:8000',       // Android emulator
    'https://caredroid.ai',       // Production web
    'android://com.caredroid.clinical', // Android app (if using custom scheme)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Platform',
    'X-App-Version',
    'X-Device-Id',
  ],
});
```

### SSL/TLS for Production
```typescript
// backend/src/main.ts
const app = await NestFactory.create(AppModule, {
  httpsOptions: {
    key: fs.readFileSync('./secrets/private-key.pem'),
    cert: fs.readFileSync('./secrets/certificate.pem'),
  },
});
```

**Android Network Security Config:**
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Development only -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

---

## Backend Environment Variables

### Android-Specific Configuration
```bash
# backend/.env

# API Configuration
NODE_ENV=production
PORT=8000
API_BASE_URL=https://api.caredroid.ai

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/caredroid

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Firebase (for Android push notifications)
FIREBASE_PROJECT_ID=caredroid-clinical
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@caredroid-clinical.iam.gserviceaccount.com

# OpenAI (for chat)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Redis (for caching/sessions)
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_ANDROID_CHAT=20
RATE_LIMIT_ANDROID_AUTH=10
RATE_LIMIT_ANDROID_HEALTH=30

# File Upload
MAX_FILE_SIZE=10485760  # 10MB for Android
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

---

## Docker Configuration for Backend

### Docker Compose with Android Support
```yaml
# docker-compose.yml (updated for Android)
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/caredroid
      - REDIS_URL=redis://redis:6379
      # Firebase credentials from .env
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
    depends_on:
      - db
      - redis
    networks:
      - caredroid-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=caredroid
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - caredroid-network

  redis:
    image: redis:7-alpine
    networks:
      - caredroid-network

networks:
  caredroid-network:
    driver: bridge

volumes:
  postgres-data:
```

---

## Testing Backend with Android

### Local Development
```bash
# 1. Start backend
cd backend
npm install
npm run start:dev

# 2. Find your local IP (for physical device testing)
# Linux/Mac:
ifconfig | grep "inet "
# Windows:
ipconfig

# 3. Update Android BuildConfig
# Edit android/gradle.properties or local.properties
API_BASE_URL=http://192.168.1.100:8000

# 4. Rebuild Android app
cd android
./gradlew clean assembleDebug
```

### Backend Health Check
```bash
# Test backend is accessible from Android
curl http://10.0.2.2:8000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-02-02T10:30:00.000Z",
  "version": "1.0.0",
  "platform": "android"
}
```

---

## Production Deployment Checklist

- [ ] Backend deployed to production server
- [ ] SSL/TLS certificates configured
- [ ] Firebase Admin SDK credentials configured
- [ ] Database migrations run
- [ ] Redis cache configured
- [ ] Rate limiting configured
- [ ] CORS origins include Android app
- [ ] Environment variables set
- [ ] Health check endpoint working
- [ ] Monitoring/logging enabled
- [ ] Android app points to production URL

---

## Monitoring Android-Specific Issues

### Backend Logging
```typescript
// backend/src/modules/logging/android-logger.service.ts
@Injectable()
export class AndroidLoggerService {
  logAndroidRequest(req: Request) {
    const platform = req.headers['x-platform'];
    const appVersion = req.headers['x-app-version'];
    const deviceId = req.headers['x-device-id'];
    
    if (platform === 'android') {
      this.logger.log({
        event: 'android_request',
        method: req.method,
        path: req.path,
        appVersion,
        deviceId,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  logAndroidError(error: Error, context: any) {
    this.logger.error({
      event: 'android_error',
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Metrics to Track
- Android app version distribution
- Request response times by platform
- Error rates (Android vs. Web)
- FCM notification delivery rates
- Offline sync success rates
- API endpoint usage by platform

---

## Summary

### Backend Changes for Android
✅ API endpoints support Android client  
✅ FCM integration for push notifications  
✅ Offline sync endpoints  
✅ Platform-specific rate limiting  
✅ CORS configured for Android  
✅ Android-specific headers recognized  
✅ SSL/TLS for secure communication  

### Android Changes for Backend
✅ Retrofit HTTP client configured  
✅ OkHttp interceptors for auth  
✅ Platform headers sent  
✅ FCM token registration  
✅ Offline sync implementation  
✅ Network security config  

**Both Android app and backend are configured to work together seamlessly!**

---

For deployment guide, see: `android/DEPLOYMENT_GUIDE.md`  
For backend API documentation, see: `backend/README.md`
