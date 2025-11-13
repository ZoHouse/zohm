# Deployment Guide

**Project**: Zo World Map (ZOHM)  
**Last Updated**: 2025-11-13  
**Platform**: Vercel (Recommended) / Self-Hosted

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Migration](#database-migration)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)
9. [Self-Hosted Deployment](#self-hosted-deployment)

---

## Overview

### Deployment Targets

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Development** | Local testing | `localhost:3000` |
| **Staging** | Pre-production testing | `staging.zo.xyz` |
| **Production** | Live application | `app.zo.xyz` |

### Tech Stack

- **Frontend**: Next.js 15 (React Server Components)
- **Hosting**: Vercel (Edge Network)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **DNS**: Cloudflare or Vercel DNS

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm build`)
- [ ] No console.log statements in production code
- [ ] Environment variables configured
- [ ] Security audit complete

### Database

- [ ] Migrations tested on staging
- [ ] Rollback scripts prepared
- [ ] Backup created
- [ ] RLS policies verified
- [ ] Indexes optimized

### Performance

- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB (gzipped)
- [ ] Images optimized
- [ ] API response times < 500ms
- [ ] Database query times < 100ms

### Security

- [ ] API keys rotated
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Authentication tested
- [ ] Secrets encrypted

---

## Vercel Deployment

### 1. Connect Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd apps/web
vercel link
```

**Follow prompts**:
- Set up and deploy: Yes
- Which scope: Your Vercel team
- Link to existing project: No (first time)
- Project name: `zohm-webapp`
- Directory: `./apps/web`

### 2. Configure Project

In Vercel Dashboard:

1. Go to Project Settings
2. **Build & Development Settings**:
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: pnpm build
   Output Directory: .next
   Install Command: pnpm install
   ```

3. **Environment Variables**: (see next section)

### 3. Deploy

```bash
# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod
```

**Vercel will**:
1. Clone repository
2. Install dependencies
3. Run build
4. Deploy to Edge Network
5. Assign URLs

**Expected output**:
```
✓ Deployment ready
https://zohm-webapp-xxx.vercel.app (Preview)
https://app.zo.xyz (Production)
```

---

## Environment Configuration

### Production Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# ============================================================================
# Supabase (Production Database)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# ============================================================================
# Privy (Production Auth)
# ============================================================================
NEXT_PUBLIC_PRIVY_APP_ID=your-prod-privy-app-id
PRIVY_APP_SECRET=your-prod-privy-secret

# ============================================================================
# Mapbox (Production Token)
# ============================================================================
NEXT_PUBLIC_MAPBOX_TOKEN=your-prod-mapbox-token

# ============================================================================
# Base URL (for API routes)
# ============================================================================
NEXT_PUBLIC_BASE_URL=https://app.zo.xyz
NEXT_PUBLIC_API_URL=https://app.zo.xyz/api

# ============================================================================
# ZO API (Production)
# ============================================================================
ZO_API_BASE_URL=https://api.zo.xyz
ZO_CLIENT_KEY_WEB=your-prod-zo-key
ZO_CLIENT_DEVICE_ID=your-prod-device-id
ZO_CLIENT_DEVICE_SECRET=your-prod-device-secret

# ============================================================================
# Web3 / NFT (Base Mainnet)
# ============================================================================
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_FOUNDER_PASS_CONTRACT=0x...

# ============================================================================
# Analytics & Monitoring
# ============================================================================
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=auto
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# ============================================================================
# Security
# ============================================================================
NEXTAUTH_URL=https://app.zo.xyz
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# ============================================================================
# Rate Limiting (Future)
# ============================================================================
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Environment Variable Scopes

In Vercel, set scopes:
- **Production**: For `app.zo.xyz`
- **Preview**: For PR previews (staging values)
- **Development**: For local dev (dev values)

---

## Database Migration

### Pre-Deployment

```bash
# 1. Backup production database
# In Supabase Dashboard → Database → Backups → Create Backup

# 2. Test migration on staging
psql $STAGING_DATABASE_URL < migrations/XXX_new_migration.sql

# 3. Verify staging works
# Test all features on staging.zo.xyz

# 4. Prepare rollback
psql $STAGING_DATABASE_URL < migrations/XXX_new_migration_ROLLBACK.sql
# If rollback works, proceed to production
```

### During Deployment

```bash
# 1. Enable maintenance mode (optional)
# Create apps/web/app/maintenance/page.tsx

# 2. Run migration
psql $PRODUCTION_DATABASE_URL < migrations/XXX_new_migration.sql

# 3. Verify migration
psql $PRODUCTION_DATABASE_URL -c "\dt"  # List tables
psql $PRODUCTION_DATABASE_URL -f scripts/check-database.sql

# 4. Deploy application
vercel --prod

# 5. Smoke test
curl https://app.zo.xyz/api/health
curl https://app.zo.xyz/api/leaderboard
```

### Migration Checklist

- [ ] Backup created
- [ ] Migration tested on staging
- [ ] Rollback script prepared
- [ ] Downtime estimated
- [ ] Team notified
- [ ] Monitoring dashboard open
- [ ] Rollback plan ready

---

## Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://app.zo.xyz/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# User authentication
# Visit: https://app.zo.xyz
# Try logging in

# Database connectivity
curl https://app.zo.xyz/api/leaderboard
# Expected: Array of leaderboard entries

# Map rendering
# Visit: https://app.zo.xyz
# Verify map loads with markers
```

### 2. Verify Features

- [ ] Homepage loads
- [ ] Map renders correctly
- [ ] Login/logout works
- [ ] User profile displays
- [ ] Quest completion saves
- [ ] Leaderboard updates
- [ ] API routes respond
- [ ] Images load
- [ ] Fonts load

### 3. Monitor Metrics

**Vercel Analytics**:
- Check deployment status
- Monitor error rate
- Check response times
- Verify traffic routing

**Supabase Dashboard**:
- Check database load
- Monitor query performance
- Verify RLS policies active
- Check connection pool

**Sentry (if configured)**:
- Watch for errors
- Check error frequency
- Verify source maps working

### 4. Team Notification

```
🚀 Deployment Complete

Environment: Production
URL: https://app.zo.xyz
Version: v1.2.3
Commit: abc123def456
Deployed by: @username
Time: 2025-11-13 10:30 UTC

✅ All smoke tests passed
✅ Database migration successful
✅ Performance metrics normal

Changes:
- Added Game1111 data persistence
- Fixed leaderboard update trigger
- Optimized API response times
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check deployment status
vercel ls

# Check error rate
# Vercel Dashboard → Analytics → Errors

# Check database size
# Supabase Dashboard → Database → Database Usage

# Review logs
vercel logs https://app.zo.xyz --limit 100
```

### Weekly Maintenance

- [ ] Review Sentry errors
- [ ] Check database performance
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Backup database
- [ ] Check disk usage

### Monthly Tasks

- [ ] Rotate API keys
- [ ] Review access logs
- [ ] Update documentation
- [ ] Performance audit
- [ ] Security scan
- [ ] Cost optimization

---

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# 1. List recent deployments
vercel ls

# 2. Promote previous deployment
vercel promote <previous-deployment-url>

# Example:
vercel promote https://zohm-webapp-abc123.vercel.app
```

**Rollback time**: ~30 seconds

### Database Rollback

```bash
# If database migration needs rollback:

# 1. Run rollback script
psql $PRODUCTION_DATABASE_URL < migrations/XXX_migration_ROLLBACK.sql

# 2. Verify rollback
psql $PRODUCTION_DATABASE_URL -f scripts/check-database.sql

# 3. Redeploy previous application version
vercel promote <previous-deployment-url>
```

### Emergency Rollback Plan

**If deployment causes critical issues**:

1. **Immediate**: Rollback to previous Vercel deployment
2. **Within 5 min**: Notify team, investigate logs
3. **Within 15 min**: Identify root cause
4. **Within 30 min**: Deploy fix or remain on rollback
5. **Within 1 hour**: Post-mortem, update runbook

---

## Self-Hosted Deployment

### Docker Deployment

**1. Build Docker Image**:

```dockerfile
# Dockerfile (apps/web/Dockerfile)
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**2. Build and Run**:

```bash
# Build image
docker build -t zohm-webapp:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY \
  -e NEXT_PUBLIC_PRIVY_APP_ID=$PRIVY_ID \
  zohm-webapp:latest
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  webapp:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
      - NEXT_PUBLIC_PRIVY_APP_ID=${PRIVY_ID}
      - NEXT_PUBLIC_MAPBOX_TOKEN=${MAPBOX_TOKEN}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - webapp
    restart: unless-stopped
```

**Run**:

```bash
docker-compose up -d
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name app.zo.xyz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.zo.xyz;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    location / {
        proxy_pass http://webapp:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## CI/CD Pipeline (GitHub Actions)

**`.github/workflows/deploy.yml`**:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Troubleshooting

### Deployment Failed

```bash
# Check build logs
vercel logs <deployment-url>

# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Build timeout
# 4. Out of memory

# Solution: Check logs and fix issues
```

### Database Connection Failed

```bash
# Check Supabase status
# Visit: https://status.supabase.com

# Verify environment variables
vercel env ls

# Test connection
psql $PRODUCTION_DATABASE_URL -c "SELECT 1"
```

### Slow Performance

```bash
# Check Vercel Analytics
# Dashboard → Analytics → Performance

# Common causes:
# 1. Large bundle size
# 2. Unoptimized images
# 3. Slow API routes
# 4. Database N+1 queries

# Solution: Profile and optimize
```

---

## Security Best Practices

### Secrets Management

- ✅ Use Vercel environment variables
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Never commit secrets to git
- ✅ Use different secrets per environment
- ❌ Don't hardcode API keys

### CORS Configuration

```typescript
// apps/web/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', 'https://app.zo.xyz');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}
```

---

## Related Documentation

- `DEVELOPMENT_SETUP.md` - Local development
- `ARCHITECTURE.md` - System architecture
- `DATABASE_SCHEMA.md` - Database structure
- `API_ENDPOINTS.md` - API reference
- `RECEIPTS/README.md` - Change tracking

---

**Last Updated**: 2025-11-13  
**Maintained By**: DevOps Team  
**Status**: ✅ Complete

