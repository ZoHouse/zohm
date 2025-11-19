# 🚀 Start Here - Zo World Documentation

**Welcome to Zo World!** This guide will help you get oriented quickly.

---

## 📍 **Quick Navigation**

### **New to the Project?**
1. **[README.md](../README.md)** - Main project overview with screenshots
2. **[PROJECT_RULES.md](./PROJECT_RULES.md)** - 25 foundational principles ⭐
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and tech stack
4. **[DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)** - Get your local environment running

### **Building a Feature?**
1. **[FEATURES/README.md](./FEATURES/README.md)** - All feature specifications
2. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - API reference
3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database structure
4. **[CONSTRAINTS.md](./CONSTRAINTS.md)** - What you can/cannot modify

### **Working with AI?**
1. **[cursorrule.md](./cursorrule.md)** - AI pair-coding rules
2. **[API_CONTRACTS.md](./API_CONTRACTS.md)** - Machine-readable contracts
3. **[WORK_ORDERS/](./WORK_ORDERS/)** - Task management system

---

## 🎯 **The Six Core Systems**

Every feature in Zo World strengthens at least one of these:

1. **Vibe Score** - Real-time alignment percentage (0-100%)
2. **Quests** - Interaction primitives that generate signals
3. **Nodes** - Physical locations with resonance
4. **Citizens** - Users with identity and progression
5. **Map Interface** - Reality interaction canvas
6. **Narrative Engine** - Processes signals into story

Learn more in [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🏗️ **Tech Stack**

- **Frontend**: Next.js 15, React 19, TypeScript 5, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Privy (wallet + social auth)
- **Blockchain**: Base (L2), Avalanche Fuji (testnet)
- **Maps**: Mapbox GL JS (3D visualization)
- **AI/ML**: AssemblyAI (voice), OpenAI (narrative)
- **Deployment**: Vercel, GitHub Actions

---

## 🚀 **Quick Start (5 Minutes)**

```bash
# 1. Clone the repo
git clone https://github.com/ZoHouse/zohm.git
cd zohm

# 2. Install dependencies
pnpm install

# 3. Set up environment
cd apps/web
cp .env.example .env.local
# Add your API keys to .env.local

# 4. Run the dev server
pnpm dev

# 5. Open http://localhost:3000
```

Detailed setup: [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)

---

## 📚 **Documentation Index**

### **Core Docs**
- [PROJECT_RULES.md](./PROJECT_RULES.md) - 25 foundational principles
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database schema
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API reference

### **System Specs**
- [QUESTS_SYSTEM.md](./QUESTS_SYSTEM.md) - Quest mechanics
- [VIBE_SCORE.md](./VIBE_SCORE.md) - Vibe Score algorithm
- [ZO_PASSPORT_FOUNDER_VS_CITIZEN.md](./ZO_PASSPORT_FOUNDER_VS_CITIZEN.md) - Identity progression
- [TOKEN_ECONOMICS.md](./TOKEN_ECONOMICS.md) - Token system

### **Features**
- [FEATURES/](./FEATURES/) - All feature specifications
  - Mapbox Integration
  - Events System
  - Quests System
  - Onboarding Flow
  - Voice Quest (Quantum Sync)
  - Game1111

### **Workflow & Safety**
- [CONSTRAINTS.md](./CONSTRAINTS.md) - Safe editing zones
- [cursorrule.md](./cursorrule.md) - AI pair-coding guidelines
- [WORK_ORDERS/](./WORK_ORDERS/) - Task management
- [LAUNDRY/](./LAUNDRY/) - Small tasks
- [RECEIPTS/](./RECEIPTS/) - Change tracking

---

## 🤝 **Contributing**

Before making changes:

1. Read [PROJECT_RULES.md](./PROJECT_RULES.md)
2. Check [CONSTRAINTS.md](./CONSTRAINTS.md) for safe editing zones
3. Create a work order for medium+ tasks
4. Generate receipts for protected paths
5. Run tests before committing

### **Safe Editing Zones**

✅ **Safe to edit**: `components/**`, `hooks/**`, `sdk/**`, `docs/**`, `tests/**`

⚠️ **Requires review**: `api/**`, `migrations/**`, `workflows/**`

🚫 **Never touch**: `.env files`, `package.json`, `contracts/**`

---

## 🔗 **Important Links**

- **Main Repo**: [github.com/ZoHouse/zohm](https://github.com/ZoHouse/zohm)
- **Website**: [zo.xyz](https://zo.xyz)
- **Dashboard**: [app.zo.xyz](https://app.zo.xyz)
- **Protocol Lore**: [zo_protocol_lore.md](../lore/zo_protocol_lore.md)

---

## 💬 **Philosophy**

> *"Reality is a graph, not a tree. Design features as graph entities with propagation across nodes, citizens, events, quests, and vibe."*

> *"Every interaction must produce a signal. Every signal must strengthen the engine."*

> *"Zo World must feel alive. Build for the future, not the past. Protect the vibe. Keep magic alive."*

---

## 📞 **Need Help?**

1. Check this guide for navigation
2. Read relevant docs in the index above
3. Browse [FEATURES/](./FEATURES/) for specs
4. Ask in team channel

---

**Last Updated**: November 19, 2025  
**Status**: ✅ Production Ready  
**Version**: v1.0.0
