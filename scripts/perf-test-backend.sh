#!/bin/bash

# Performance Testing Script for CareDroid-Ai Backend
# Runs load tests and captures metrics

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        CAREDROID-AI BACKEND PERFORMANCE TEST SUITE              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Starting backend performance tests..."
echo ""

# Check if backend is running
echo "Checking backend health..."
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
  echo "✓ Backend is running on port 3000"
else
  echo "✗ Backend not responding on port 3000"
  echo "  Please start backend with: npm run start:dev"
  exit 1
fi

echo ""
echo "Running Autocannon load test..."
echo "Configuration: 50 concurrent connections, 20 second duration"
echo ""

# Run Autocannon with output capture
RESULTS_FILE="/tmp/autocannon-results.json"
npx autocannon \
  -c 50 \
  -d 20 \
  --json \
  http://localhost:3000/health \
  > "$RESULTS_FILE" 2>&1

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    📊 LOAD TEST RESULTS                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -f "$RESULTS_FILE" ]; then
  cat "$RESULTS_FILE"
else
  echo "Note: Detailed metrics require Autocannon completion"
fi

echo ""
echo "✓ Performance testing completed"
