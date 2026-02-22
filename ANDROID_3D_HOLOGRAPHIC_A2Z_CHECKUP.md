# Android 3D Holographic A–Z Checkup

## Scope Checked
- Core engines: `src/components/3d/*`, `src/components/holographic/*`
- Main entry points: `src/pages/Chat.jsx`, `src/pages/Dashboard.jsx`, `src/pages/tools/LabInterpreter.jsx`
- 3D tool surfaces: `DrugChecker`, `Calculators`, `LabTimeline`, `EmergencyModal`
- Chat 3D backend path: `/api/chat/message-3d` with fallback to `/api/chat/message`

## Key Findings
1. Two 3D stacks are active:
   - Advanced stack: `src/components/3d/HolographicCanvas.jsx`
   - Lightweight holographic stack: `src/components/holographic/HolographicCanvas.jsx`
2. Primary Android risk was in lightweight stack:
   - It forced 2D fallback for many phones (`lowPerf` path), reducing Android 3D availability.
   - Render invalidation loop continued regardless of tab visibility.
   - GPU settings stayed high-performance even on constrained devices.

## Fixes Applied in This Checkup
- Updated `src/components/holographic/HolographicCanvas.jsx`:
  - Added WebGL availability check before rendering 3D canvas.
  - Removed premature 2D fallback for low-performance devices.
  - Kept 3D enabled on low-tier Android with adaptive limits.
  - Made frame invalidation visibility-aware (skip while document hidden).
  - Reduced heavy scene load on low-tier devices (`Stars` count lowered).
  - Switched GL power preference to `low-power` on constrained hardware.
  - Reduced effective FPS target on constrained hardware.
  - Reduced control motion on constrained hardware.

## Current A–Z Status (Android 3D)
- ✅ Chat hero 3D, anatomy 3D, and backend 3D route with fallback
- ✅ Dashboard 3D timeline and widget-level holographic cards
- ✅ Tool-level 3D (DrugChecker, SOFA charting, Lab timeline)
- ✅ WebGL unsupported fallback messaging remains intact
- ✅ Performance guardrails now favor Android availability + stability

## Remaining Optional Hardening (Next Step)
1. Add one shared `Mobile3DContainer` wrapper to standardize safe-area/margins/heights.
2. Add lightweight runtime telemetry to detect sustained FPS drops on Android and auto-step down quality.
3. Add Playwright mobile smoke checks for 3D render presence and fallback mode.
