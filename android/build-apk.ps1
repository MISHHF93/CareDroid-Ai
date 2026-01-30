# Build Android APK - Helper Script
# Run this after installing Android Studio

Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CareDroid - Android APK Builder     ║" -ForegroundColor White
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan

# Set Java environment
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "`n✓ Java JDK 17 configured" -ForegroundColor Green
Write-Host "  $env:JAVA_HOME" -ForegroundColor DarkGray

# Check for Android SDK
Write-Host "`n🔍 Checking for Android SDK..." -ForegroundColor Yellow

$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

$foundSdk = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $foundSdk = $path
        break
    }
}

if ($foundSdk) {
    Write-Host "✓ Found Android SDK" -ForegroundColor Green
    Write-Host "  $foundSdk" -ForegroundColor DarkGray
    
    # Create local.properties
    $sdkFormatted = $foundSdk -replace '\\', '/'
    $localProps = "sdk.dir=$sdkFormatted"
    Set-Content -Path "$PSScriptRoot\local.properties" -Value $localProps
    Write-Host "`n✓ Created local.properties" -ForegroundColor Green
    
    # Build APK
    Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  Building Android APK...              ║" -ForegroundColor White
    Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host "`nThis will take 3-5 minutes on first build...`n" -ForegroundColor DarkGray
    
    & "$PSScriptRoot\gradlew.bat" assembleDebug
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  BUILD SUCCESSFUL! ✓                  ║" -ForegroundColor White
        Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Green
        
        $apkPath = "$PSScriptRoot\app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $apkPath) {
            $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
            Write-Host "`nAPK Location:" -ForegroundColor Yellow
            Write-Host "  $apkPath" -ForegroundColor Cyan
            Write-Host "`nAPK Size: $apkSize MB" -ForegroundColor White
            
            Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Magenta
            Write-Host "║  INSTALL ON DEVICE/EMULATOR           ║" -ForegroundColor White
            Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Magenta
            Write-Host "`nOption 1 - ADB Install:" -ForegroundColor Yellow
            Write-Host "  adb install $apkPath" -ForegroundColor Cyan
            Write-Host "`nOption 2 - Drag & Drop:" -ForegroundColor Yellow
            Write-Host "  Drag APK to Android Emulator" -ForegroundColor White
            Write-Host "`nOption 3 - Copy to Phone:" -ForegroundColor Yellow
            Write-Host "  Transfer APK and tap to install" -ForegroundColor White
        }
    } else {
        Write-Host "`n❌ BUILD FAILED" -ForegroundColor Red
        Write-Host "Check the error messages above" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Android SDK not found" -ForegroundColor Red
    Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ANDROID STUDIO REQUIRED              ║" -ForegroundColor White
    Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Red
    
    Write-Host "`n1. Download Android Studio:" -ForegroundColor Yellow
    Write-Host "   https://developer.android.com/studio" -ForegroundColor Cyan
    
    Write-Host "`n2. Install and complete first-time setup" -ForegroundColor Yellow
    
    Write-Host "`n3. SDK will be installed to:" -ForegroundColor Yellow
    Write-Host "   $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor White
    
    Write-Host "`n4. Run this script again after installation`n" -ForegroundColor Yellow
}

Write-Host ""
