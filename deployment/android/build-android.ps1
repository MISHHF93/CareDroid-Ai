# Build script for Android APK
Write-Host "🚀 Building CareDroid Android APK..." -ForegroundColor Cyan

# Set Java Home
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
Write-Host "✓ Java Home: $env:JAVA_HOME" -ForegroundColor Green

# Step 1: Build frontend
Write-Host "`n📦 Step 1: Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green

# Step 2: Sync with Capacitor
Write-Host "`n🔄 Step 2: Syncing with Capacitor..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Capacitor sync completed" -ForegroundColor Green

# Step 3: Build Android APK
Write-Host "`n🤖 Step 3: Building Android APK..." -ForegroundColor Cyan
Set-Location android
.\gradlew.bat assembleDebug
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host "❌ Android build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build Complete!" -ForegroundColor Green
Write-Host "📱 APK Location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
Write-Host "`n🎉 Ready to install on device!" -ForegroundColor Cyan
