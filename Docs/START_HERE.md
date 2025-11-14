# 🚀 START HERE - Zo World

**Welcome to Zo World** - A Life Design Simulation Engine that helps people live consciously, creatively, and in sync with their highest timeline.

This guide will get you from zero to running the project in **under 30 minutes**.

---

## 🎯 What is Zo World?

Zo World is not just an app - it's a **reality interface** that transforms how people interact with physical locations, creative quests, and their own evolution.

**Core Concept**: Real-world actions → Signals → State → Narrative → Personal transformation

**Tech Stack**: Next.js 15, React 19, Supabase, Mapbox GL, Privy Auth, Avalanche blockchain

**Philosophy**: Reality is a graph, not a tree. Every interaction is a node. Every choice creates ripples.

---

## ⚡ Quick Setup (30 Minutes)

### Prerequisites

- **Node.js** 20+ (check: `node -v`)
- **pnpm** 9+ (install: `npm install -g pnpm`)
- **Git** (check: `git --version`)
- **Code editor** (VS Code recommended)
- **Supabase account** (free tier works)

### Step 1: Clone & Install (5 min)

```bash
# Clone the repository
git clone https://github.com/ZoHouse/zohm.git
cd zohm

# Install dependencies
pnpm install

# Navigate to web app
cd apps/web
```

### Step 2: Environment Setup (10 min)

Create `apps/web/.env.local`:

```bash
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Privy (Wallet Auth)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# Mapbox (Map Interface)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# ZO API (Identity Service)
NEXT_PUBLIC_ZO_API_URL=https://zo-hq-api-production.up.railway.app
ZO_API_KEY=your_zo_api_key

# Optional: Blockchain (for token rewards)
CUSTOM_TOKEN_ADDRESS=your_token_address
REWARD_WALLET_PRIVATE_KEY=your_private_key
```

**Need credentials?** Ask the team or check internal docs.

### Step 3: Database Setup (10 min)

```bash
# Run migrations (from project root)
cd packages/api
node scripts/run-migration.js

# Verify tables exist
# Check Supabase dashboard → Table Editor
# Should see: users, quests, nodes, events, etc.
```

### Step 4: Run Locally (5 min)

```bash
# Start the dev server
cd apps/web
pnpm dev

# Open browser
open http://localhost:3000
```

**You should see**: The Zo World landing page with Mapbox map

### Step 5: Test the Flow

1. **Click "Enter Zo World"**
2. **Connect wallet** (Privy will handle this)
3. **Complete onboarding**:
   - Choose nickname
   - Select avatar
   - Watch portal animation
   - Complete voice quest (auto-succeeds in dev)
4. **Explore the map** - See nodes, events, quests
5. **Complete a quest** - Try Game1111

**Congrats! You're running Zo World locally.** 🎉

---

## 🧠 Core Concepts (Read This Next)

### The Six Core Systems

Every feature must strengthen at least one of these:

1. **Vibe Score** - Real-time alignment percentage (0-100%)
2. **Quests** - Interaction primitives that generate signals
3. **Nodes** - Physical locations with resonance
4. **Citizens** - Users with identity and progression
5. **Map Interface** - Reality interaction canvas (not just UI)
6. **Narrative Engine** - Processes signals into story

### Signal Flow

```
Raw Data → Signals → State → Narrative → UI
```

Example:
```
User completes quest → quest_completed signal → 
Update vibe score → Generate narrative snippet → 
Show congratulations + unlock next quest
```

### Reality Graph

- **Not a tree** - Every action can affect multiple nodes
- **Propagation matters** - Changes ripple through the graph
- **Time is causal** - Every state transition has a timestamp
- **Observable by default** - All meaningful changes emit telemetry

---

## 📚 Essential Reading (In Order)

### Must Read First (1 hour)

1. **`PROJECT_RULES.md`** ⭐ - The 25 foundational rules (start here!)
2. **`ARCHITECTURE.md`** - System architecture and data flows
3. **`CONSTRAINTS.md`** - What you can/cannot modify
4. **`cursorrule.md`** - AI pair-coding rules and workflows

### For Your Role

**Backend Developer**:
- `DATABASE_SCHEMA.md` - Full database schema
- `API_ENDPOINTS.md` - All API routes
- `API_CONTRACTS.md` - Machine-readable contracts

**Frontend Developer**:
- `FEATURES/README.md` - All feature specs
- `FEATURES/01-mapbox-integration.md` - Map system
- `FEATURES/03-quests-spec.md` - Quest mechanics

**Full-Stack Developer**:
- Read all of the above
- `QUESTS_SYSTEM.md` - Quest system deep dive
- `VIBE_SCORE.md` - Vibe calculation algorithm

**AI Assistant**:
- `AI_PAIR_CODING_SETUP.md` - Complete AI workflows
- `cursorrule.md` - Detailed rules and principles

---

## 🛠️ Your First Contribution

### Pick a Task

**Easy (1-2 hours)**:
1. Browse `Docs/LAUNDRY/` for small tasks
2. Pick one marked 🟢 Available
3. Follow the laundry list template
4. Submit PR

**Medium (4-8 hours)**:
1. Browse `Docs/WORK_ORDERS/` for structured tasks
2. Check acceptance criteria
3. Create a work order if needed
4. Get approval before starting

**Advanced (1-2 days)**:
1. Check GitHub issues
2. Propose new feature via RFC
3. Create comprehensive work order
4. Collaborate with team

### Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes (respecting CONSTRAINTS.md)

# 3. Test locally
pnpm build
pnpm test

# 4. Commit (following conventions)
git commit -m "feat: add new quest type"

# 5. Push and create PR
git push origin feature/your-feature-name
```

### PR Checklist

- [ ] Code follows PROJECT_RULES.md principles
- [ ] No linter errors (`pnpm build`)
- [ ] Updated relevant documentation
- [ ] Created receipt if modifying guarded paths
- [ ] Tested locally and works
- [ ] PR description explains what/why/how

---

## 🎯 Common Tasks

### Add a New UI Component

```bash
# Location: apps/web/src/components/
# Status: ✅ AI Editable (no receipt needed)

# 1. Create component file
touch apps/web/src/components/MyComponent.tsx

# 2. Follow React 19 patterns
# 3. Use Tailwind for styling
# 4. Export from component
# 5. Import where needed
```

### Add a New Quest

```bash
# Location: apps/web/src/lib/questService.ts
# Status: ⚠️ Guarded (receipt required)

# 1. Read QUESTS_SYSTEM.md
# 2. Define quest config in questService.ts
# 3. Add quest to database via migration
# 4. Test reward calculations
# 5. Generate receipt via scripts/generate_receipt.py
```

### Add a New API Endpoint

```bash
# Location: apps/web/src/app/api/
# Status: ⚠️ Guarded (receipt required)

# 1. Create endpoint file: api/my-endpoint/route.ts
# 2. Define contract in API_CONTRACTS.md
# 3. Implement validation
# 4. Add error handling
# 5. Test with curl/Postman
# 6. Generate receipt
# 7. Update API_ENDPOINTS.md
```

### Modify the Map

```bash
# Location: apps/web/src/components/MapComponent.tsx
# Status: ✅ AI Editable

# 1. Read FEATURES/01-mapbox-integration.md
# 2. Modify map behavior
# 3. Ensure narrative triggers still work
# 4. Test on different screen sizes
```

### Add a Database Migration

```bash
# Location: packages/api/migrations/
# Status: ⚠️ Guarded (receipt required)

# 1. Create migration: XXX_description.sql
# 2. Write UP migration (add tables/columns)
# 3. Write DOWN migration (rollback)
# 4. Test locally
# 5. Document in work order
# 6. DO NOT commit to git (per project rules)
# 7. Document in receipt instead
```

---

## 🧭 Project Structure

```
zohm/
├── apps/
│   └── web/                    # Next.js web app
│       ├── src/
│       │   ├── app/           # Next.js 15 app router
│       │   ├── components/    # ✅ AI Editable
│       │   ├── hooks/         # ✅ AI Editable
│       │   ├── lib/           # ⚠️ Some guarded
│       │   └── types/         # ✅ AI Editable
│       └── public/            # Static assets
├── packages/
│   ├── api/                   # Backend services
│   │   └── migrations/        # ⚠️ Guarded
│   ├── contracts/             # 🔒 Immutable (smart contracts)
│   ├── sdk/                   # ✅ AI Editable (shared types)
│   └── shared/                # Shared utilities
├── Docs/                      # 📚 Documentation
│   ├── FEATURES/              # Feature specifications
│   ├── LAUNDRY/               # Small tasks
│   ├── WORK_ORDERS/           # Medium tasks
│   └── RECEIPTS/              # Change tracking
├── scripts/                   # Utility scripts
└── lore/                      # Protocol lore & ontology
```

---

## 🚦 Path Classification

Before editing any file, check `CONSTRAINTS.md`:

### ✅ AI Editable (Edit Freely)
- `apps/web/src/components/**`
- `apps/web/src/hooks/**`
- `packages/sdk/**`
- `docs/**`
- `tests/**`

### ⚠️ Guarded (Requires Receipt)
- `apps/web/src/app/api/**`
- `apps/web/src/lib/questService.ts`
- `packages/api/migrations/**`
- `.github/workflows/**`

### 🔒 Immutable (Never Touch)
- `.env` files
- `packages/contracts/**`
- `apps/web/package.json` (without approval)
- `apps/web/next.config.ts`

**Rule of thumb**: If it affects security, blockchain, or infrastructure → ask first.

---

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

### Database Connection Issues

1. Check `.env.local` has correct Supabase credentials
2. Verify Supabase project is running
3. Check RLS policies in Supabase dashboard
4. Run migrations again if tables are missing

### Map Not Loading

1. Verify `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`
2. Check browser console for Mapbox errors
3. Ensure token has correct scopes
4. Try refreshing Mapbox token

### Privy Auth Not Working

1. Check `NEXT_PUBLIC_PRIVY_APP_ID` is correct
2. Verify domain is whitelisted in Privy dashboard
3. Clear browser localStorage
4. Try incognito mode

### AR Scanner Build Error

**Status**: AR scanner is currently commented out (not production ready)

If you see TypeScript errors about A-Frame:
- This is expected - AR code is commented out
- Search for `TODO: Uncomment when AR is ready`
- Don't uncomment unless working on AR feature

---

## 🎓 Learning Path

### Week 1: Foundation
- [ ] Set up local environment
- [ ] Read PROJECT_RULES.md thoroughly
- [ ] Understand the 6 core systems
- [ ] Complete a small LAUNDRY task
- [ ] Review 2-3 PRs from others

### Week 2: Deep Dive
- [ ] Read all feature specs in FEATURES/
- [ ] Understand signal flow end-to-end
- [ ] Implement a medium work order
- [ ] Add a new quest or component
- [ ] Participate in architecture discussions

### Week 3: Contributing
- [ ] Propose a new feature via RFC
- [ ] Create comprehensive work order
- [ ] Implement with tests
- [ ] Help others with code reviews
- [ ] Update documentation

### Ongoing: Mastery
- [ ] Understand Vibe Score algorithm
- [ ] Contribute to narrative engine
- [ ] Optimize performance
- [ ] Mentor new contributors
- [ ] Shape product direction

---

## 💡 Best Practices

### Code Quality

- **Clear over clever** - Write code a stranger can debug at 3AM
- **Explicit state** - No hidden side effects
- **Small functions** - Each does one thing well
- **Meaningful names** - `calculateVibeScore()` not `calc()`
- **Comments for why** - Not what (code shows what)

### Architecture

- **Single source of truth** - No duplicate canonical state
- **Observable by default** - Emit telemetry for state changes
- **Reversible changes** - Every migration has a rollback
- **Graph not tree** - Design for propagation
- **Lore compliant** - Never contradict Zo ontology

### Collaboration

- **Ask before assuming** - Check with team on unclear requirements
- **Small PRs** - Easier to review, faster to merge
- **Document decisions** - Future you will thank you
- **Test thoroughly** - Local testing prevents production issues
- **Respect constraints** - They exist for good reasons

---

## 🤝 Getting Help

### Documentation
1. Search this docs folder first
2. Check FEATURES/ for feature-specific questions
3. Read API_CONTRACTS.md for API questions
4. Review closed PRs for similar changes

### Team Communication
- **Slack/Discord**: Quick questions, daily updates
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Architecture, design decisions
- **PRs**: Code review, implementation feedback

### Office Hours
- Check team calendar for office hours
- Schedule 1:1 with lead developers
- Attend weekly sync meetings
- Join feature planning sessions

---

## 🎊 You're Ready!

You now have:
- ✅ Local development environment running
- ✅ Understanding of core concepts
- ✅ Knowledge of project structure
- ✅ Path to your first contribution
- ✅ Resources for learning more

**Next Steps**:
1. Pick a task from `Docs/LAUNDRY/`
2. Read the relevant feature spec
3. Make your first PR
4. Join team discussions

**Remember**: 
- Build for the future, not the past
- Protect the vibe
- Keep magic alive
- Ship fast, ship clean
- Citizens come first

Welcome to Zo World. Let's build something extraordinary. 🚀

---

**Questions?** 
- Check `Docs/README.md` for document index
- Read `AI_PAIR_CODING_SETUP.md` for workflows
- Ask in team chat

**Last Updated**: 2025-11-14  
**Status**: ✅ Production Ready  
**Maintained By**: Development Team

