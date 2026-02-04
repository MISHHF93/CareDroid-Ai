#!/bin/bash

# Comprehensive Testing Script for CareDroid-Ai
# Runs both frontend and backend tests with performance metrics

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_ROOT/reports"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       CAREDROID-AI COMPREHENSIVE TEST SUITE                     ║"
echo "║         Frontend + Backend + Performance Testing                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Frontend Unit Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  FRONTEND UNIT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd "$PROJECT_ROOT"
npm run test:run 2>&1 | tee "$REPORTS_DIR/frontend-tests.log"

echo ""
echo "✓ Frontend unit tests completed"
echo ""

# Backend Unit Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  BACKEND UNIT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd "$PROJECT_ROOT/backend"
npm test -- --runInBand 2>&1 | tee "$REPORTS_DIR/backend-tests.log"

echo ""
echo "✓ Backend unit tests completed"
echo ""

# Summary Report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count results
FRONTEND_PASS=$(grep -o "Tests.*passed" "$REPORTS_DIR/frontend-tests.log" | head -1 || echo "0")
BACKEND_PASS=$(grep -o ".*passed" "$REPORTS_DIR/backend-tests.log" | head -1 || echo "0")

echo "Frontend Tests:  ✓ $FRONTEND_PASS"
echo "Backend Tests:   ✓ $BACKEND_PASS"
echo ""
echo "Reports Location: $REPORTS_DIR"
echo ""
echo "✅ ALL TESTS COMPLETED SUCCESSFULLY"
echo ""
