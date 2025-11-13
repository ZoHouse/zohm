# Development Setup Guide

**Project**: Zo World Map (ZOHM)  
**Last Updated**: 2025-11-13  
**Platform**: macOS, Linux, Windows (WSL2)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Tool | Version | Install Command |
|------|---------|-----------------|
| **Node.js** | 20.x LTS | `brew install node@20` (macOS) |
| **pnpm** | 8.x+ | `npm install -g pnpm` |
| **Git** | 2.x+ | `brew install git` (macOS) |
| **PostgreSQL** | 15.x | For local DB (optional, use Supabase instead) |

### Optional Tools

| Tool | Purpose | Install Command |
|------|---------|-----------------|
| **VS Code** | IDE | Download from code.visualstudio.com |
| **Cursor** | AI-powered IDE | Download from cursor.sh |
| **Postman** | API testing | Download from postman.com |
| **Docker** | Containerization | `brew install --cask docker` |

### Accounts Needed

- [ ] **GitHub** account (for repository access)
- [ ] **Supabase** account (for database)
- [ ] **Mapbox** account (for map features)
- [ ] **Privy** account (for authentication - current)
- [ ] **Vercel** account (for deployment - optional)

---

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repo
git clone https://github.com/ZoHouse/zohm.git
cd zohm

# Checkout development branch
git checkout samurai-new

# Or create your own feature branch
git checkout -b feature/your-feature-name
```

### 2. Install Dependencies

```bash
# Install all dependencies (monorepo + webapp + packages)
pnpm install

# Or use npm
npm install
```

**Expected output**:
```
✓ Dependencies installed
✓ Workspace packages linked
✓ Postinstall scripts complete
```

### 3. Verify Installation

```bash
# Check Node version
node --version
# Should output: v20.x.x

# Check pnpm version
pnpm --version
# Should output: 8.x.x

# List workspace packages
pnpm list --depth 0
```

---

## Environment Variables

### 1. Copy Environment Template

```bash
# In the webapp directory
cd apps/web
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `apps/web/.env.local`:

```bash
# ============================================================================
# Supabase (Database)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================================================
# Privy (Authentication - Current)
# ============================================================================
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret

# ============================================================================
# Mapbox (Map Features)
# ============================================================================
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# ============================================================================
# ZO API (Future - for avatar generation)
# ============================================================================
ZO_API_BASE_URL=https://api.zo.xyz
ZO_CLIENT_KEY_WEB=your-zo-client-key
ZO_CLIENT_DEVICE_ID=your-device-id
ZO_CLIENT_DEVICE_SECRET=your-device-secret

# ============================================================================
# Optional: Web3 / NFT Features
# ============================================================================
NEXT_PUBLIC_CHAIN_ID=8453  # Base mainnet
NEXT_PUBLIC_FOUNDER_PASS_CONTRACT=0x...

# ============================================================================
# Optional: Analytics & Monitoring
# ============================================================================
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
```

### 3. Get API Keys

#### Supabase Setup

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

#### Privy Setup

1. Go to [privy.io](https://privy.io)
2. Create new app
3. Copy:
   - App ID → `NEXT_PUBLIC_PRIVY_APP_ID`
   - App Secret → `PRIVY_APP_SECRET`
4. Configure login methods (Email, Wallet, Social)

#### Mapbox Setup

1. Go to [mapbox.com](https://mapbox.com)
2. Create account or sign in
3. Go to Account → Access Tokens
4. Create new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
5. Copy token → `NEXT_PUBLIC_MAPBOX_TOKEN`

---

## Database Setup

### Option A: Use Supabase (Recommended)

```bash
# 1. Run migrations in Supabase SQL Editor
# Navigate to: https://app.supabase.com/project/your-project/sql

# 2. Run each migration file in order:
# - migrations/001_privy_migration.sql
# - migrations/002_foundation_individual_progression.sql
# - migrations/003_city_progression.sql

# 3. Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Option B: Local PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb zohm_dev

# Run migrations
psql zohm_dev < migrations/001_privy_migration.sql
psql zohm_dev < migrations/002_foundation_individual_progression.sql
psql zohm_dev < migrations/003_city_progression.sql

# Update .env.local with local database URL
DATABASE_URL=postgresql://localhost:5432/zohm_dev
```

### Verify Database Setup

```bash
# Run database check script
psql -d your_database_url -f scripts/check-database.sql

# Expected output: All tables exist ✓
```

---

## Running Locally

### Start Development Server

```bash
# From project root
cd apps/web
pnpm dev

# Or from root (if workspace script configured)
pnpm run dev:web
```

**Expected output**:
```
   ▲ Next.js 15.0.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.x:3000

 ✓ Ready in 2.3s
```

### Access the Application

1. Open browser to `http://localhost:3000`
2. You should see the Zo World landing page
3. Try logging in with Privy

### Hot Reload

Changes to files will automatically reload:
- **React components**: Hot reload (instant)
- **API routes**: Requires browser refresh
- **Environment variables**: Requires server restart

---

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test QuestAudio.test.tsx
```

### Test Database

```bash
# Set up test database (if using local PostgreSQL)
createdb zohm_test
psql zohm_test < migrations/*.sql

# Run with test database
DATABASE_URL=postgresql://localhost:5432/zohm_test pnpm test
```

### Manual Testing Checklist

- [ ] Homepage loads
- [ ] Map renders with Mapbox
- [ ] Login with Privy works
- [ ] User profile displays
- [ ] Quest completion saves to database
- [ ] Leaderboard updates

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

```bash
# Edit files
code apps/web/src/components/YourComponent.tsx

# Check what changed
git status
git diff
```

### 3. Run Linter

```bash
pnpm lint
pnpm lint:fix  # Auto-fix issues
```

### 4. Test Changes

```bash
pnpm test
pnpm dev  # Manual testing
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add your feature"

# Follow conventional commits:
# feat: new feature
# fix: bug fix
# docs: documentation
# chore: maintenance
# refactor: code refactor
# test: tests
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name

# Then open PR on GitHub
# Use PR template (.github/PULL_REQUEST_TEMPLATE.md)
```

---

## Troubleshooting

### Port Already in Use

```bash
# Error: Port 3000 is already in use

# Solution: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Module Not Found

```bash
# Error: Cannot find module '@/lib/supabase'

# Solution: Reinstall dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Mapbox Not Loading

```bash
# Error: Mapbox container not found

# Solution: Check environment variable
echo $NEXT_PUBLIC_MAPBOX_TOKEN

# If empty, add to .env.local and restart server
```

### Database Connection Failed

```bash
# Error: Failed to connect to database

# Solution 1: Check Supabase project is running
# Visit: https://app.supabase.com/project/your-project

# Solution 2: Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Solution 3: Check network/firewall
curl $NEXT_PUBLIC_SUPABASE_URL
```

### TypeScript Errors

```bash
# Error: Type 'X' is not assignable to type 'Y'

# Solution: Rebuild TypeScript
pnpm run build

# Or restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Git Permission Denied

```bash
# Error: Permission denied (publickey)

# Solution: Set up SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add key to GitHub: Settings → SSH Keys
```

---

## IDE Setup

### VS Code Extensions

Install these extensions for best experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "GraphQL.vscode-graphql",
    "ms-azuretools.vscode-docker"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.next": true,
    "**/node_modules": true
  }
}
```

---

## Next Steps

After setup is complete:

1. **Read Documentation**:
   - `Docs/ARCHITECTURE.md` - System overview
   - `Docs/FEATURES/README.md` - Feature specs
   - `Docs/CONSTRAINTS.md` - Development rules

2. **Pick a Task**:
   - Check `Docs/LAUNDRY/` for quick wins
   - Review `Docs/WORK_ORDERS/` for larger tasks
   - Ask team for assignments

3. **Start Coding**:
   - Follow feature specs
   - Write tests
   - Open PR using template

---

## Getting Help

**Stuck?** Try these resources:

1. **Documentation**: Check `Docs/` folder
2. **Troubleshooting**: See section above
3. **Team Chat**: Ask in Slack/Discord
4. **GitHub Issues**: Search existing issues
5. **Stack Overflow**: For general Next.js/React questions

---

## Related Documentation

- `ARCHITECTURE.md` - System architecture
- `DEPLOYMENT_GUIDE.md` - Deploy to production
- `API_ENDPOINTS.md` - API reference
- `CONSTRAINTS.md` - Development rules
- `FEATURES/README.md` - Feature specifications

---

**Last Updated**: 2025-11-13  
**Maintained By**: Development Team  
**Status**: ✅ Complete

