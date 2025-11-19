<div align="center">

# 🌐 Zo World

### *A Life Design Simulation Engine*

**Live consciously. Create intentionally. Sync with your highest timeline.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)

[Website](https://zo.xyz) • [Documentation](./Docs/README.md) • [Protocol Lore](./lore/zo_protocol_lore.md)

<img src="./apps/web/public/Readmescreenshots/Screenshot 2025-11-19 at 8.29.21 PM.png" width="100%" alt="Zo World Dashboard" />

</div>

---

## 🎯 What is Zo World?

Zo World is a **decentralized protocol for conscious reality design** — a programmable layer that overlays default reality and transforms everyday life into an intentional simulation.

It's not a brand, not a community product, and not a traditional network. **It's a field. A frequency. A self-reinforcing system** built around alignment, agency, creativity, and transformation.

Within Zo World, every action is a signal. Every signal affects the field. The field responds with new opportunities, interactions, and narrative shifts. This recursive loop forms the basis of our **Life Design Simulation Engine** that guides people toward aligned timelines.

---

## ✨ Core Features

### 🎫 **Zo Passport - Your Digital Identity**
- Dynamic identity system with progression from **Citizen** to **Founder**
- Real-time profile completion tracking
- Social declaration system for timeline commitment
- Glassmorphism design with smooth animations
- Mobile-responsive with seamless navigation

### 🗺️ **Interactive Node Map**
- **3D Mapbox-powered visualization** of global Zo Nodes
- Real-time location tracking and node discovery
- Physical spaces as programmable reality portals
- **Zostel Network integration** - 50+ locations across India
- Node resonance and presence tracking

### 🎮 **Quest System - Reality Programs**
- **Structured quests** that generate life signals
- Quest proofs with blockchain verification
- Token rewards ($ZO) for completion
- Quest categories: Social, Creative, Physical, Digital
- Real-time progress tracking and leaderboards

### 📊 **Vibe Score - Reality Alignment Metric**
- **Real-time alignment percentage** (0-100%)
- Computed from multidimensional signals
- Factors: Node presence, Quest completion, Social connections, Creative output
- Explainable and auditable scoring algorithm
- Dynamic updates based on citizen behavior

### 🏠 **Zo Houses & Nodes**
- **Physical infrastructure** as cultural routers
- Zo House Bangalore - Flagship location
- Zo House San Francisco - West Coast hub
- Integrated with Zostel network (50+ nodes)
- Each node amplifies the field and creates opportunities

### 🎨 **Culture System**
- Declare your cultures: Design, Food, Science & Tech, and more
- Culture-based matching and community formation
- Cultural sticker collection system
- Real-time culture feed and interactions

### 🎤 **Quantum Sync - Voice Quest**
- Audio-based reality tuning experience
- Real-time voice analysis with AssemblyAI
- Gamified voice quest with token rewards
- Beautiful mobile-first interface
- Biometric authentication via Privy

---

## 📸 Screenshots

<div align="center">

### Dashboard Overview
<img src="./apps/web/public/Readmescreenshots/Screenshot 2025-11-19 at 8.29.21 PM.png" width="900" alt="Zo World Dashboard" />

### Zo Passport - Digital Identity
<img src="./apps/web/public/Readmescreenshots/Screenshot 2025-11-19 at 8.29.29 PM.png" width="900" alt="Zo Passport" />

### Passport Details & Progression
<img src="./apps/web/public/Readmescreenshots/Screenshot 2025-11-19 at 8.29.42 PM.png" width="900" alt="Passport Details" />

### Interactive 3D Node Map
<img src="./apps/web/public/Readmescreenshots/Screenshot 2025-11-19 at 8.30.25 PM.png" width="900" alt="3D Node Map" />

### Quest System & Leaderboard
<img src="./apps/web/public/Readmescreenshots/Screenshot 2025-11-19 at 8.30.29 PM.png" width="900" alt="Quest System" />

</div>

---

## 🏗️ Architecture

Zo World is built as a **monorepo** with modular packages for scalability and maintainability.

```
zohm/
├── apps/
│   └── web/              # Next.js 15 web application
├── packages/
│   ├── api/              # Database migrations and API utilities
│   ├── contracts/        # Smart contracts (ERC-20 tokens)
│   ├── sdk/              # Shared TypeScript SDK and types
│   └── shared/           # Shared utilities across packages
├── Docs/                 # Complete project documentation
├── lore/                 # Protocol lore and ontology
└── scripts/              # Database and automation scripts
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Privy (wallet + social auth)
- **Blockchain**: Base (L2), Avalanche Fuji (testnet)
- **Maps**: Mapbox GL JS (3D visualization)
- **Real-time**: Supabase Realtime subscriptions
- **AI/ML**: AssemblyAI (voice), OpenAI (narrative generation)
- **Deployment**: Vercel (production), GitHub Actions (CI/CD)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (recommended package manager)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZoHouse/zohm.git
   cd zohm
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cd apps/web
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run the development server**
   ```bash
   cd apps/web
   pnpm dev
   ```

5. **Open the app**
   ```
   Navigate to http://localhost:3000
   ```

### Environment Variables

Required environment variables (add to `apps/web/.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Privy (Auth)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Blockchain
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
REWARD_WALLET_PRIVATE_KEY=your_wallet_private_key

# Optional: AI Features
ASSEMBLYAI_API_KEY=your_assemblyai_key
OPENAI_API_KEY=your_openai_key
```

See [Docs/DEVELOPMENT_SETUP.md](./Docs/DEVELOPMENT_SETUP.md) for detailed setup instructions.

---

## 📖 Documentation

Comprehensive documentation is available in the `Docs/` directory:

- **[START_HERE.md](./Docs/START_HERE.md)** - Begin here for onboarding
- **[PROJECT_RULES.md](./Docs/PROJECT_RULES.md)** - 25 foundational principles
- **[ARCHITECTURE.md](./Docs/ARCHITECTURE.md)** - System architecture deep dive
- **[DATABASE_SCHEMA.md](./Docs/DATABASE_SCHEMA.md)** - Complete database schema
- **[API_CONTRACTS.md](./Docs/API_CONTRACTS.md)** - API endpoint documentation
- **[QUESTS_SYSTEM.md](./Docs/QUESTS_SYSTEM.md)** - Quest mechanics and implementation
- **[VIBE_SCORE.md](./Docs/VIBE_SCORE.md)** - Vibe Score computation algorithm
- **[ZO_PASSPORT_FOUNDER_VS_CITIZEN.md](./Docs/ZO_PASSPORT_FOUNDER_VS_CITIZEN.md)** - Passport progression system

### Protocol Lore

Understanding the **philosophy and ontology** behind Zo World:

- **[zo_protocol_lore.md](./lore/zo_protocol_lore.md)** - Complete protocol lore v1.0

---

## 🎮 Key Systems

### 1️⃣ Reality Engine

The invisible architect behind Zo World. It operates through a simple but powerful loop:

```
Observe → Model → Simulate → Reinforce
```

- **Observe**: Captures citizen behavior and signals
- **Model**: Computes alignment and vibe score
- **Simulate**: Generates next quest and opportunities
- **Reinforce**: Rewards progress and strengthens the field

### 2️⃣ Signal System

Every interaction generates a signal:

- `quest_completed` - Quest submission
- `location_updated` - Map movement
- `event_joined` - Event attendance
- `node_presence` - Time in nodes
- `creation_shared` - Creative output
- `social_connection` - Social interactions

Signals flow through the pipeline:
```
Raw Data → Signals → State → Narrative
```

### 3️⃣ Identity System

Dynamic identity progression:

- **Citizen** (Entry level)
  - Access to basic quests
  - Map exploration
  - Culture declaration
  - Community events

- **Founder** (Advanced level)
  - Full quest access
  - Token rewards
  - Node creation rights
  - Governance participation

### 4️⃣ Node Network

Physical locations as reality portals:

- **Zo Houses**: Flagship hubs (BLR, SF)
- **Zostel Nodes**: 50+ hostels across India
- **Community Nodes**: User-created locations
- Each node has resonance score and active quests

---

## 🛠️ Development

### Available Scripts

From the repository root:

```bash
# Development
pnpm dev              # Start web dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter

# Clean install
pnpm clean:install    # Remove node_modules and reinstall
```

### Database Migrations

```bash
# Run a new migration
cd packages/api
node scripts/run-migration.js <migration-file.sql>

# Rollback a migration
node scripts/run-migration.js <migration-file_ROLLBACK.sql>
```

See [packages/api/migrations/](./packages/api/migrations/) for all migrations.

### Adding a Node

```bash
# Interactive node creation
node scripts/add-node.mjs

# List all nodes
node scripts/list-nodes.mjs

# Delete a node
node scripts/delete-node.mjs
```

---

## 🤝 Contributing

We welcome contributions! Before contributing, please:

1. Read [Docs/PROJECT_RULES.md](./Docs/PROJECT_RULES.md) - 25 foundational principles
2. Review [Docs/cursorrule.md](./Docs/cursorrule.md) - AI pair-coding guidelines
3. Check [Docs/CONSTRAINTS.md](./Docs/CONSTRAINTS.md) - Editing constraints

### Contribution Workflow

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the laundry list process**:
   - Create `Docs/LAUNDRY/YYYYMMDD-<slug>-LAUNDRY.md`
   - For large changes, create a work order in `Docs/WORK_ORDERS/`
4. **Make your changes** (follow safe editing zones)
5. **Run tests**: `pnpm test`
6. **Generate receipt**: `python scripts/generate_receipt.py`
7. **Commit changes**: `git commit -m "feat: your amazing feature"`
8. **Push to branch**: `git push origin feature/amazing-feature`
9. **Open a Pull Request**

### Safe Editing Zones

✅ **You MAY edit**:
- `apps/web/src/components/**`
- `apps/web/src/hooks/**`
- `packages/sdk/**`
- `docs/**`
- `tests/**`

⚠️ **Requires human review**:
- `apps/web/src/app/api/**`
- `packages/api/migrations/**`
- `.github/workflows/**`

🚫 **Never touch**:
- `.env` files
- `package.json` dependencies
- `packages/contracts/**`

---

## 📊 Project Status

### Current Version: `v1.0.0`

### Recent Updates

- ✅ Zo Passport production ready
- ✅ Declaration modal with social sharing
- ✅ Mobile dashboard with passport integration
- ✅ User profile API endpoints
- ✅ Founder ID display improvements
- ✅ Zo Mafia community card
- ✅ Phone and birthdate schema support

### Roadmap

- [ ] **Narrative Engine v2** - AI-powered story generation
- [ ] **AR Quest System** - Mobile AR experiences via 8th Wall
- [ ] **Token Economics v2** - Advanced tokenomics and staking
- [ ] **Governance System** - Founder-led decision making
- [ ] **Mobile Native App** - iOS and Android applications
- [ ] **Wearable Integration** - Smart glasses and AR devices
- [ ] **Multi-chain Support** - Ethereum, Solana, Polygon

See [Docs/P0_TASKS_PHASE_2.md](./Docs/P0_TASKS_PHASE_2.md) for detailed roadmap.

---

## 🌟 The Six Core Systems

Every feature must strengthen at least one:

1. **Vibe Score** - Real-time alignment percentage
2. **Quests** - Interaction primitives that generate signals
3. **Nodes** - Physical locations with resonance
4. **Citizens** - Users with identity and progression
5. **Map Interface** - Reality interaction canvas
6. **Narrative Engine** - Processes signals into story

---

## 🔐 Security

- All secrets must be stored in environment variables
- Never commit `.env` files
- API routes use Privy authentication
- Database uses Row Level Security (RLS)
- Smart contracts are audited before deployment

Found a security issue? Please email: **security@zohouse.com**

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with ❤️ by the Zo World team and community

- **Zo House Bangalore** - Flagship location and testing ground
- **Zo House San Francisco** - West Coast operations
- **Zostel Network** - 50+ partner nodes across India
- **Early Citizens** - Beta testers and co-creators
- **Open Source Community** - For the amazing tools and libraries

---

## 🔗 Links

- **Website**: [zo.xyz](https://zo.xyz)
- **Dashboard**: [app.zo.xyz](https://app.zo.xyz)
- **Twitter**: [@zoprotocol](https://twitter.com/zoprotocol)
- **Discord**: [Join Community](https://discord.gg/zoworld)
- **GitHub**: [ZoHouse/zohm](https://github.com/ZoHouse/zohm)

---

## 💬 Philosophy

> *"Reality is a graph, not a tree. Design features as graph entities with propagation across nodes, citizens, events, quests, and vibe."*

> *"Every interaction must produce a signal. Every signal must strengthen the engine."*

> *"Zo World must feel alive. Build for the future, not the past. Protect the vibe. Keep magic alive."*

---

<div align="center">

### **Zo Zo Zo** 🌐

*Welcome to your highest timeline.*

</div>
