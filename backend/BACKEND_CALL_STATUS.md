# Backend Call Status Report

**Date:** February 1, 2026  
**Target:** Swagger UI route http://localhost:8000/api#/auth/AuthController_register

## Summary
The backend is **running and reachable** on http://127.0.0.1:8000. The Swagger UI and the AuthController register endpoint are available via this address. Note: http://localhost:8000 refused the connection during this check.

## Checks Performed

### 1) Health Endpoint
**Request:** `GET http://127.0.0.1:8000/health`  
**Result:** ✅ 200 OK  
**Response:** `{ "status": "ok", "service": "CareDroid API", "version": "1.0.0" }`

### 2) Swagger JSON
**Request:** `GET http://127.0.0.1:8000/api-json`  
**Result:** ✅ Reachable  
**Auth Register Path:** ✅ `/api/auth/register`  
**Operation ID:** `AuthController_register`

## Status of Backend Calls
- **Swagger UI:** Reachable at http://127.0.0.1:8000/api#/auth/AuthController_register
- **AuthController Register Endpoint:** Reachable (`POST /api/auth/register`)
- **Note:** http://localhost:8000 refused the connection; use http://127.0.0.1:8000

## Next Action to Validate
Optional: If you need localhost instead of 127.0.0.1, update the host binding or your hosts resolution. Otherwise, you can proceed using 127.0.0.1.

