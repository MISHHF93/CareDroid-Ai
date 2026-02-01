# CareDroid Authentication Setup Test Script
Write-Host "================================" -ForegroundColor Cyan
Write-Host "CareDroid Authentication Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running on port 3000
Write-Host "[1/5] Checking if backend is running on port 3000..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 2
    Write-Host "✓ Backend is RUNNING on port 3000" -ForegroundColor Green
    Write-Host "   Status: $($backendHealth.status)" -ForegroundColor Gray
    Write-Host "   Service: $($backendHealth.service)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend is NOT running on port 3000" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Action: Run 'cd backend; npm run start:dev'" -ForegroundColor Yellow
}

Write-Host ""

# Check if frontend is running on port 8000
Write-Host "[2/5] Checking if frontend is running on port 8000..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 2 -UseBasicParsing
    Write-Host "✓ Frontend is RUNNING on port 8000" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend is NOT running on port 8000" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Action: Run 'npm run dev'" -ForegroundColor Yellow
}

Write-Host ""

# Test auth register endpoint
Write-Host "[3/5] Testing /api/auth/register endpoint..." -ForegroundColor Yellow
try {
    $testUser = @{
        email = "test@example.com"
        password = "TestPassword123!"
        fullName = "Test User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testUser `
        -TimeoutSec 3
    
    Write-Host "✓ Register endpoint is accessible" -ForegroundColor Green
    Write-Host "   Response: $($registerResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✓ Register endpoint is accessible (400 = user may already exist)" -ForegroundColor Green
    } else {
        Write-Host "✗ Register endpoint failed" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}

Write-Host ""

# Check .env configuration
Write-Host "[4/5] Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    $apiUrl = ($envContent | Select-String "VITE_API_URL=(.*)").Matches.Groups[1].Value
    if ([string]::IsNullOrWhiteSpace($apiUrl)) {
        Write-Host "✓ VITE_API_URL is empty (using Vite proxy)" -ForegroundColor Green
    } else {
        Write-Host "⚠ VITE_API_URL is set to: $apiUrl" -ForegroundColor Yellow
        Write-Host "   For dev mode, this should be empty to use Vite proxy" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
}

Write-Host ""

# Check backend .env configuration
Write-Host "[5/5] Checking backend .env configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $backendEnv = Get-Content "backend\.env" -Raw
    $port = ($backendEnv | Select-String "PORT=(\d+)").Matches.Groups[1].Value
    
    if ($port -eq "3000") {
        Write-Host "✓ Backend PORT is correctly set to 3000" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend PORT is set to: $port (should be 3000)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ backend\.env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Check Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If backend is not running: cd backend; npm run start:dev" -ForegroundColor White
Write-Host "2. If frontend is not running: npm run dev" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:8000" -ForegroundColor White
Write-Host "4. Try registering a new account or use 'Direct Sign-In'" -ForegroundColor White
Write-Host ""
