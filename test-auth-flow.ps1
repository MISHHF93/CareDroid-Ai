# Auth Flow Diagnostic Script
# Tests the complete authentication flow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CareDroid Auth Flow Diagnostic Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if servers are running
Write-Host "[1] Checking if frontend is running..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8000" -Method HEAD -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "    ✅ Frontend is running on port 8000" -ForegroundColor Green
} catch {
    Write-Host "    ❌ Frontend is NOT running on port 8000" -ForegroundColor Red
    Write-Host "    Please start it with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[2] Checking if backend is running..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "    ✅ Backend is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "    ⚠️  Backend is NOT running on port 3000" -ForegroundColor Yellow
    Write-Host "    This is OK for Direct Sign-In (uses mock auth)" -ForegroundColor Yellow
}

# Open debug test page
Write-Host "`n[3] Opening Auth Debug Test page..." -ForegroundColor Yellow
$debugUrl = "http://localhost:8000/AUTH_DEBUG_TEST.html"
Start-Process $debugUrl
Write-Host "    ✅ Opened $debugUrl" -ForegroundColor Green

# Instructions
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1️⃣  In the debug page that just opened:" -ForegroundColor White
Write-Host "   - Click '✅ Create Mock Auth Data'" -ForegroundColor White
Write-Host "   - Verify both Token and Profile show ✅" -ForegroundColor White
Write-Host "   - Click '🚀 Test Navigation to /'" -ForegroundColor White
Write-Host "   - Page should reload and show the app" -ForegroundColor White

Write-Host "`n2️⃣  Test Direct Sign-In flow:" -ForegroundColor White
Write-Host "   - Click '🗑️ Clear All Auth Data' in debug page" -ForegroundColor White
Write-Host "   - Navigate to: http://localhost:8000/auth" -ForegroundColor White
Write-Host "   - Open Browser Console (F12)" -ForegroundColor White
Write-Host "   - Click '⚡ Direct Sign-In (no auth)' button" -ForegroundColor White
Write-Host "   - Check console for detailed logs" -ForegroundColor White

Write-Host "`n3️⃣  Expected Console Output:" -ForegroundColor White
Write-Host "   🚀 DIRECT SIGN-IN CLICKED" -ForegroundColor Gray
Write-Host "   ✅ Saved to localStorage" -ForegroundColor Gray
Write-Host "   🔄 Calling onAuthSuccess..." -ForegroundColor Gray
Write-Host "   🔑 handleAuthSuccess called" -ForegroundColor Gray
Write-Host "   ✅ State update initiated" -ForegroundColor Gray
Write-Host "   🚀 RELOADING NOW" -ForegroundColor Gray
Write-Host "   🎬 UserContext INITIALIZATION" -ForegroundColor Gray
Write-Host "   ✅ Loading token into state" -ForegroundColor Gray
Write-Host "   ✅ Loading profile into state" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

Write-Host "Press any key to open the main auth page..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:8000/auth"
Write-Host "✅ Opened main auth page" -ForegroundColor Green
Write-Host "`nHappy testing! 🚀`n" -ForegroundColor Cyan
