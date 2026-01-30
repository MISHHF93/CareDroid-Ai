# Deployment Guide

Version: 1.0
Date: January 30, 2026
Owner: Engineering

## Overview
This guide describes how to deploy the CareDroid platform and the NLU microservice.

## Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.11+ (for local NLU development)
- Access to required secrets (OpenAI API key, database credentials)

## Local Deployment (Docker Compose)
1. Configure environment variables in backend/.env
2. Build images and start services using docker-compose
3. Verify health endpoints for backend and NLU

## NLU Service
- Port: 8001
- Health check: GET /health
- Prediction: POST /predict

## Backend Service
- Port: 3000 (default)
- Health check: GET /health

## Environment Variables
- NLU_SERVICE_URL
- OPENAI_API_KEY
- DATABASE_URL
- REDIS_URL
- JWT_SECRET

## Production Checklist
- TLS termination enabled
- Database encryption at rest enabled
- Backups and retention configured
- RBAC and MFA enabled
- Monitoring and alerting configured

## Rollback Strategy
- Use tagged Docker images
- Revert to last known good deployment
- Validate health checks after rollback
