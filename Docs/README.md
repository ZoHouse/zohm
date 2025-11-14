# Zo World Documentation

**Project**: Zo World Map (ZOHM)  
**Last Updated**: 2025-11-13  
**Status**: ✅ Complete & Production Ready

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **`PROJECT_RULES.md`** ⭐ - **25 Foundational Rules** for building Zo World
2. **`ARCHITECTURE.md`** - System architecture and tech stack
3. **`AI_PAIR_CODING_SETUP.md`** - How to work with this repo
4. **`CONSTRAINTS.md`** - What you can/cannot modify
5. **`FEATURES/README.md`** - Feature specifications

---

## 📚 Documentation Structure

```
Docs/
├── 🏗️ Core System Docs
│   ├── PROJECT_RULES.md ⭐ 25 FOUNDATIONAL RULES
│   ├── ARCHITECTURE.md ⭐ START HERE
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   ├── API_CONTRACTS.md
│   ├── QUESTS_SYSTEM.md
│   ├── VIBE_SCORE.md
│   └── ZO_API_DOCUMENTATION.md
│
├── 🎯 Feature Specifications
│   └── FEATURES/
│       ├── README.md
│       ├── 01-mapbox-integration.md
│       ├── 02-events-spec.md
│       ├── 03-quests-spec.md
│       ├── 04-onboarding-spec.md
│       ├── 05-voice-quest-spec.md
│       ├── 06-game1111-spec.md
│       └── legacy/ (old detailed docs)
│
├── 🛡️ Safety & Process
│   ├── CONSTRAINTS.md
│   ├── AI_PAIR_CODING_SETUP.md
│   ├── LAUNDRY/ (tiny tasks)
│   ├── WORK_ORDERS/ (medium tasks)
│   └── RECEIPTS/ (change tracking)
│
├── 📱 Platform-Specific
│   ├── mobile/ (React Native app docs)
│   └── WALLET_AND_PHONE_TO_PROFILE_FLOW.md
│
├── 🗄️ Archive
│   └── archive/ (superseded docs)
│
└── 📖 Guides (coming soon)
    ├── DEVELOPMENT_SETUP.md
    ├── DEPLOYMENT_GUIDE.md
    └── TOKEN_ECONOMICS.md
```

---

## 🎯 Documentation by Role

### For AI Assistants

**Read first**:
1. `AI_PAIR_CODING_SETUP.md` - Complete setup guide
2. `CONSTRAINTS.md` - What you can/cannot modify
3. `API_CONTRACTS.md` - API expectations
4. `FEATURES/README.md` - Feature specs

**Before coding**:
- Check path classification in `CONSTRAINTS.md`
- Read relevant feature spec
- Create Work Order if needed

### For Developers

**Getting started**:
1. `ARCHITECTURE.md` - Understand the system
2. `DEVELOPMENT_SETUP.md` - Set up local environment
3. `FEATURES/README.md` - Browse features

**During development**:
- Reference `API_ENDPOINTS.md` for API usage
- Check `DATABASE_SCHEMA.md` for DB structure
- Use feature specs as implementation guides

### For Product/Design

**Understanding the product**:
1. `ARCHITECTURE.md` - System overview
2. `FEATURES/README.md` - All features at a glance
3. Individual feature specs - Detailed UX notes

**Planning work**:
- Create Work Orders for new features
- Update feature specs when requirements change
- Track acceptance criteria

---

## 📖 Core Documentation

### System Architecture

**`ARCHITECTURE.md`** ⭐
Complete system architecture, tech stack, data flows, and future roadmap.

**`DATABASE_SCHEMA.md`**
Full Supabase/Postgres schema with tables, relationships, triggers, and RLS policies.

**`API_ENDPOINTS.md`**
Complete API reference with request/response examples for all endpoints.

**`API_CONTRACTS.md`**
Machine-readable contracts for AI development with validation rules.

### Features & Systems

**`QUESTS_SYSTEM.md`**
Quest mechanics, reward calculations, cooldown system, and Game1111 integration.

**`VIBE_SCORE.md`**
Vibe Score specification with feature extraction, scoring algorithm, and API contracts.

**`ZO_API_DOCUMENTATION.md`**
External ZO API reference including authentication, profile, and avatar endpoints.

**`WALLET_AND_PHONE_TO_PROFILE_FLOW.md`**
Phone number to wallet authentication flow and migration strategy.

---

## 🎯 Feature Specifications

All feature specs are in `FEATURES/` folder:

| # | Feature | Status | File |
|---|---------|--------|------|
| 01 | Mapbox Integration | ✅ Implemented | `01-mapbox-integration.md` |
| 02 | Events System | 🚧 Partial | `02-events-spec.md` |
| 03 | Quests System | ✅ Core Complete | `03-quests-spec.md` |
| 04 | Onboarding Flow | 🚧 In Progress | `04-onboarding-spec.md` |
| 05 | Voice Quest | 🔮 Planned | `05-voice-quest-spec.md` |
| 06 | Game1111 | ✅ Core Implemented | `06-game1111-spec.md` |

See `FEATURES/README.md` for complete feature list and status.

---

## 🛡️ Safety & Process

### Path Rules

**`CONSTRAINTS.md`**
Defines editable/guarded/immutable paths and workflows for safe changes.

**Path Summary**:
- ✅ **Editable**: `components/`, `hooks/`, `styles/` - modify freely
- ⚠️ **Guarded**: `api/`, `migrations/`, `lib/questService.ts` - need receipts
- 🔒 **Immutable**: `contracts/`, `infra/`, workflows - need permission

### Task Management

**`LAUNDRY/README.md`**
System for tiny tasks (<30 minutes) that can be picked up autonomously.

**`WORK_ORDERS/README.md`**
System for medium tasks (1-4 hours) requiring planning and review.

**`RECEIPTS/README.md`**
Change tracking system for all modifications to guarded/immutable paths.

### AI Pair-Coding

**`AI_PAIR_CODING_SETUP.md`**
Complete guide for safe AI pair-coding with workflows, examples, and best practices.

---

## 📱 Platform-Specific

### Mobile App

**`mobile/`** folder contains React Native app documentation:
- `APP_OVERVIEW.md` - Mobile app architecture
- `MOBILE_APP_DATABASE_API.md` - Mobile API reference
- `AVATAR_PROFILE_FIREBASE_DOCUMENTATION.md` - Avatar system

**Note**: Mobile app is currently in separate repo, planned for monorepo migration.

---

## 🗄️ Archive

**`archive/`** folder contains superseded documentation:
- `START_HERE.md` - Original onboarding plan
- `ENV_SETUP.md` - Old environment setup
- `SUPABASE_SETUP.md` - Old database setup
- `AVATAR_INTEGRATION_STATUS.md` - Old progress tracking

See `archive/README.md` for details on what's archived and why.

---

## 📝 Creating New Documentation

### Adding a Feature Spec

1. Copy template from `FEATURES/README.md`
2. Create `FEATURES/XX-feature-name.md`
3. Fill out all sections
4. Update `FEATURES/README.md` index
5. Link from `ARCHITECTURE.md` if relevant

### Adding a Work Order

1. Copy template from `WORK_ORDERS/README.md`
2. Create `WORK_ORDERS/WO-XXX-description.md`
3. Get approval before starting work
4. Generate receipt for guarded paths
5. Archive after completion

### Adding a Laundry Item

1. Copy template from `LAUNDRY/README.md`
2. Create `LAUNDRY/LAUNDRY-XXX-description.md`
3. Mark status as 🟢 Available
4. Pick up and complete
5. Archive when done

---

## 🔄 Updating Documentation

### When to Update

- **Feature changes** → Update feature spec
- **API changes** → Update `API_CONTRACTS.md` and `API_ENDPOINTS.md`
- **DB changes** → Update `DATABASE_SCHEMA.md`
- **Process changes** → Update relevant process doc

### How to Update

1. Edit the document
2. Increment version (if major change)
3. Update "Last Updated" date
4. Commit with `docs: update XXX`
5. Create receipt if guarded/immutable doc

---

## 🔍 Finding Documentation

### By Topic

- **Architecture**: `ARCHITECTURE.md`
- **API**: `API_ENDPOINTS.md`, `API_CONTRACTS.md`
- **Database**: `DATABASE_SCHEMA.md`
- **Features**: `FEATURES/` folder
- **Quests**: `QUESTS_SYSTEM.md`, `FEATURES/03-quests-spec.md`
- **Auth**: `WALLET_AND_PHONE_TO_PROFILE_FLOW.md`
- **Process**: `CONSTRAINTS.md`, `LAUNDRY/`, `WORK_ORDERS/`, `RECEIPTS/`

### By Status

- **Production Ready**: `ARCHITECTURE.md`, `API_ENDPOINTS.md`, `DATABASE_SCHEMA.md`
- **In Development**: Check `FEATURES/` for status icons
- **Planned**: Check `VIBE_SCORE.md`, some feature specs
- **Archived**: `archive/` folder

---

## 📊 Documentation Health

| Metric | Status |
|--------|--------|
| **Core Docs** | ✅ Complete |
| **Feature Specs** | ✅ 6/6 Complete |
| **Process Docs** | ✅ Complete |
| **Safety Systems** | ✅ Active |
| **SDK** | ✅ Ready |
| **Guides** | 🚧 In Progress |

**Overall Status**: 🟢 Production Ready

---

## 🤝 Contributing

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Provide API contracts for all endpoints
- Add acceptance criteria for features
- Include rollback plans for changes

### Review Process

1. Create or update documentation
2. Self-review for completeness
3. Open PR using template
4. Get review from doc owner
5. Merge and notify team

---

## 📞 Support

**Need help?**

1. Check this README for document locations
2. Read `AI_PAIR_CODING_SETUP.md` for workflows
3. Browse `FEATURES/` for feature specs
4. Ask in team channel

---

## 🎯 Quick Links

### Most Used Docs
- [Architecture](ARCHITECTURE.md)
- [API Endpoints](API_ENDPOINTS.md)
- [Feature Specs](FEATURES/README.md)
- [Database Schema](DATABASE_SCHEMA.md)

### For AI Development
- [AI Setup Guide](AI_PAIR_CODING_SETUP.md)
- [Constraints](CONSTRAINTS.md)
- [API Contracts](API_CONTRACTS.md)

### Process & Safety
- [Work Orders](WORK_ORDERS/README.md)
- [Receipts](RECEIPTS/README.md)
- [Laundry List](LAUNDRY/README.md)

---

**Last Updated**: 2025-11-13  
**Maintained By**: Development Team  
**Total Docs**: 27+ files  
**Status**: ✅ Complete & Production Ready
