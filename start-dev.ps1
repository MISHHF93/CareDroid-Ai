# Start unified development environment - everything accessible on port 8000
Write-Host "🚀 Starting CareDroid Development Environment..." -ForegroundColor Cyan
Write-Host "`n📱 Unified App: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs: http://localhost:8000/api (proxied)" -ForegroundColor Cyan
Write-Host "🔧 Backend runs on port 3000 (internal)" -ForegroundColor Gray
Write-Host "✨ All services accessible via port 8000`n" -ForegroundColor Yellow

# Start backend in background
Write-Host "Starting backend server on port 3000..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev" -WindowStyle Minimized

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

# Start Vite dev server (will proxy API calls to backend)
Write-Host "Starting Vite dev server on port 8000...`n" -ForegroundColor Gray
npm run dev
