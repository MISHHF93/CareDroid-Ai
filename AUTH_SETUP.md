# 🔐 Authentication Setup - FIXED!

## ✅ Issues Fixed

### 1. **API URL Configuration**
**Problem:** Frontend `.env` had `VITE_API_URL=http://localhost:3000` causing direct calls instead of using Vite proxy
**Solution:** Set `VITE_API_URL=` (empty) to let Vite proxy handle routing

### 2. **Backend Port Conflict**
**Problem:** Backend `.env` had `PORT=8000` (same as frontend)
**Solution:** Changed to `PORT=3000` (backend port)

### 3. **API Client Path Resolution**
**Problem:** `apiClient.js` wasn't properly handling empty baseURL for proxy routing
**Solution:** Updated to use relative paths when baseURL is empty

---

## 🚀 How to Start the Application

###Option 1: Quick Start (Windows)
```cmd
.\start.bat
```
This opens two command windows - one for backend, one for frontend.

### Option 2: Manual Start (PowerShell)

**Terminal  1 - Backend:**
```powershell
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### Option 3: One Command (PowerShell)
```powershell
npm run start:all
```

---

## 🌐 Access URLs

- **Frontend (Main App):** http://localhost:8000
- **Backend API:** http://localhost:3000
- **Swagger API Docs:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health

---

## 🔑 Authentication Methods Available

### 1. Direct Sign-In (Development Mode)
Click the **"⚡ Direct Sign-In (no auth)"** button on the login page.
- No registration needed
- Instant access
- Uses dev bypass token

### 2. Email & Password (Full Auth)

**Register New Account:**
1. Enter your email  
2. Enter password
3. Enter full name
4. Click "Create account"
5. Backend will create user in SQLite database
6. You'll receive an access token

**Login Existing Account:**
1. Enter your registered email
2. Enter password
3. Click "Sign in"
4. If 2FA enabled, enter your 6-digit code

### 3. Magic Link (Passwordless)
1. Enter your institutional email
2. Click "Send Link"
3. Check your email for the magic link
4. Click link to authenticate

### 4. OAuth (Google/LinkedIn)
- Click "Continue with Google" or "Continue with LinkedIn"
- Redirects to OAuth provider
- Returns to app with access token

### 5. SSO (Enterprise)
- **OIDC:** For organizations using OpenID Connect
- **SAML:** For organizations using SAML 2.0
- Currently shows "not configured" message

---

## 🧪 Testing Authentication

### Test Script (PowerShell)
```powershell
.\test-auth-setup.ps1
```

This checks:
- ✓ Backend running on port 3000
- ✓ Frontend running on port 8000
- ✓ `/api/auth/register` endpoint accessible
- ✓ Environment configuration correct

### Manual API Tests

**1. Health Check:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T...",
  "service": "CareDroid API",
  "version": "1.0.0"
}
```

**2. Register New User:**
```powershell
$user = @{
  email = "newuser@example.com"
  password = "SecurePass123!"
  fullName = "New User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $user
```

**Expected:**
```json
{
  "success": true,
  "message": "Registration successful"
}
```

**3. Login:**
```powershell
$credentials = @{
  email = "newuser@example.com"
  password = "SecurePass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $credentials
```

**Expected:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "expiresIn": "15m",
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "USER"
  }
}
```

---

## 🔍 Troubleshooting

### Backend Won't Start
**Symptoms:**
- "Port 3000 is already in use"
- "Cannot find module"

**Solutions:**
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Reinstall dependencies
cd backend
rm -r node_modules
npm install
npm run start:dev
```

### Frontend Won't Start
**Symptoms:**
- "Port 8000 is already in use"
- White screen / blank page

**Solutions:**
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Clear Vite cache
rm -r node_modules/.vite
npm run dev
```

### "Failed to fetch" on Login
**Symptoms:**
- Login button does nothing
- Console error: "Failed to fetch"

**Check:**
1. Backend running? → http://localhost:3000/health
2. Frontend running? → http://localhost:8000
3. Open DevTools Network tab → Check if requests go to `/api/auth/login`
4. Check for CORS errors in console

**Solutions:**
```powershell
# Verify .env is correct
Get-Content .env | Select-String "VITE_API_URL"
# Should show: VITE_API_URL= (empty)

# Verify backend .env
Get-Content backend\.env | Select-String "PORT"
# Should show: PORT=3000

# Restart both servers
```

### "Invalid credentials" Error
**Symptoms:**
- Login fails with 401 Unauthorized
- "Invalid email or password"

**Check:**
1. User exists in database?
2. Password correct?
3. User email verified?

**Solutions:**
```powershell
# Check SQLite database
cd backend
sqlite3 caredroid.dev.sqlite
.tables
SELECT * FROM users WHERE email = 'your@email.com';
.exit
```

### 2FA Code Not Working
**Symptoms:**
- Entering 6-digit code fails
- "Invalid 2FA code"

**Solutions:**
1. Check authenticator app is synced (time-based codes)
2. Ensure you're entering current code (30-second window)
3. Try a backup code instead
4. If testing, disable 2FA in user settings

---

## 📝 Configuration Files

### Frontend .env
```env
VITE_API_URL=
VITE_WS_URL=
VITE_DEV_BEARER_TOKEN=dev-bypass-token
```

### Backend .env
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=dummy-secret-at-least-32-characters-long
DATABASE_CLIENT=sqlite
SQLITE_PATH=caredroid.dev.sqlite
```

### vite.config.js (Proxy Configuration)
```javascript
server: {
  port: 8000,
  host: true,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

---

## ✅ Authentication Flow

```
User → Frontend (localhost:8000)
  ↓
Enter credentials
  ↓
POST /api/auth/login
  ↓
Vite Proxy intercepts /api/auth/login
  ↓
Forwards to http://localhost:3000/api/auth/login
  ↓
Backend processes authentication
  ↓
Returns JWT access token
  ↓
Frontend saves to localStorage['caredroid_access_token']
  ↓
App.jsx detects token → Routes to authenticated views
  ↓
User sees Sidebar navigation + Chat interface
```

---

## 🎯 Success Indicators

✅ **Backend Ready:**
```
🚀 CareDroid Backend running on: http://localhost:3000
📚 Swagger docs available at: http://localhost:3000/api
```

✅ **Frontend Ready:**
```
➜  Local:   http://localhost:8000/
➜  Network: http://192.168.x.x:8000/
```

✅ **Authentication Working:**
- Login page loads at http://localhost:8000
- Can click "Direct Sign-In" → Redirects to chat
- Or register new account → Receives success message
- Or login with credentials → Redirects to chat with sidebar

✅ **Sidebar Navigation:**
- Sidebar visible on left
- User profile card at top
- Chat, Team, Audit Logs, Profile, Settings nav items
- Recent conversations listed
- Sign out button at bottom

---

## 🔐 Security Notes

### Development Mode
- Using weak JWT secret (for testing only)
- SQLite database (not encrypted)
- Direct sign-in bypasses authentication
- HTTPS not enforced

### Production Mode
- **CRITICAL:** Change `JWT_SECRET` to a secure 32+ character random string
- **CRITICAL:** Change `ENCRYPTION_KEY` to a secure 32-byte hex key
- Use PostgreSQL with encryption at rest
- Disable direct sign-in
- Enforce HTTPS/TLS 1.3
- Enable 2FA for all users
- Regular security audits

---

## 📚 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/verify-2fa` | Verify 2FA token |
| POST | `/api/auth/magic-link` | Request passwordless login |
| GET | `/api/auth/verify-email` | Verify email address |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/linkedin` | Initiate LinkedIn OAuth |
| GET | `/api/auth/me` | Get current user (requires JWT) |
| GET | `/health` | Health check |

---

## 🎉 You're All Set!

The authentication system is now properly wired up and ready to use!

**Quick Test:**
1. Run `.\start.bat` or manually start both servers
2. Open http://localhost:8000
3. Click **"⚡ Direct Sign-In (no auth)"**
4. You should see the chat interface with the new sidebar navigation!

**For Production:**
1. Update JWT_SECRET and ENCRYPTION_KEY in backend .env
2. Configure proper SMTP for email verification
3. Set up OAuth credentials for Google/LinkedIn
4. Deploy backend to secure hosting
5. Deploy frontend to CDN
6. Point VITE_API_URL to production backend URL

---

**Need Help?** Check the [SIDEBAR_NAVIGATION.md](./SIDEBAR_NAVIGATION.md) and [QUICKSTART.md](./QUICKSTART.md) docs!
