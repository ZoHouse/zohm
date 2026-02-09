# Zo Web Platform (`zo.xyz`)

> **The front door to Zo World — landing page, admin, and operations hub.**

- **Repository**: [github.com/ZoHouse/zo.xyz](https://github.com/ZoHouse/zo.xyz)
- **Status**: Production
- **Role**: Landing page, admin panel, property management, operations
- **Monorepo Tool**: Nx
- **Package Manager**: Yarn

---

## Overview

`zo.xyz` is the **main landing page** and operations hub for Zo World. Built as an Nx monorepo, it hosts the public-facing website where new users discover Zo World, plus admin tools, property management, payments, and operations dashboards. After landing here, users enter the game at [game.zo.xyz](./QUESTING_MAP.md) or download the [mobile app](./MOBILE_APP.md) for the full experience.

---

## Architecture

### Application Ports

| App | Port | Description |
|-----|------|-------------|
| `admin` | 4201 | Central Admin System (CAS) — back-office management |
| `website` | 4202 | Main public site at zo.xyz |
| `dashboard` | 4203 | Member dashboard and Passport interface |
| `pms` | 4204 | Property Management System |
| `payment` | 4205 | Payment processing portal |
| `web-checkin` | 4206 | Guest self-service check-in kiosk |
| `maps` | 4207 | Map visualization interface |
| `meme` | 4208 | Meme generator tool |
| `comic` | 4209 | Comic reader |
| `zo-ops` | 4210 | Operations dashboard for Zo Houses |
| `ops-backend` | 4211 | Express.js backend API server |

### Folder Structure

```
zo.xyz/
├── apps/                          # All applications
│   ├── admin/                     # CAS admin panel
│   ├── website/                   # Main public site
│   ├── dashboard/                 # Member dashboard
│   ├── pms/                       # Property management
│   ├── payment/                   # Payment portal
│   ├── web-checkin/               # Guest check-in
│   ├── maps/                      # Map interface
│   ├── meme/                      # Meme generator
│   ├── comic/                     # Comic reader
│   ├── zo-ops/                    # Operations dashboard
│   └── ops-backend/               # Express.js API
│
├── libs/                          # Shared libraries
│   ├── auth/                      # Auth library (API calls, session management)
│   ├── assets/
│   │   └── icons/                 # Shared SVG icon library
│   ├── definitions/               # TypeScript type definitions
│   │   ├── auth/                  # Auth-related types
│   │   └── general/               # General types
│   └── utils/                     # Shared utilities
│       ├── auth/                  # Auth utilities
│       ├── hooks/                 # Reusable React hooks
│       ├── next/                  # Next.js utilities
│       ├── number/                # Number formatting
│       ├── object/                # Object manipulation
│       ├── string/                # String utilities
│       └── web3/                  # Web3 / blockchain utilities
```

### Per-App Structure

Each app follows a consistent internal layout:

```
apps/<app_name>/
├── public/                        # Static assets
├── src/
│   ├── components/
│   │   ├── common/                # Header, Footer, Layout
│   │   ├── helpers/               # Page-specific components
│   │   └── ui/                    # Reusable UI components
│   ├── configs/                   # App configuration
│   ├── contexts/                  # React Context providers
│   ├── pages/                     # Next.js pages
│   └── utils/                     # App-specific utilities
├── .env                           # Production env vars
├── .env.local                     # Local/development env vars
├── .env.staging                   # Staging env vars
├── next.config.js
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Monorepo** | Nx | 17.x |
| **Framework** | Next.js | 14 |
| **UI Library** | React | 18 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **State** | React Query (TanStack) | v3 |
| **Web3** | Wagmi, Viem, RainbowKit | — |
| **Backend** | Express.js (ops-backend) | — |
| **Runtime** | Node.js | 18 |
| **Package Manager** | Yarn | latest |

---

## Shared Libraries

### `@zo/auth`
Central authentication library shared across all apps. Contains API call wrappers, session management, token refresh logic, and auth state providers.

### `@zo/assets/icons`
Shared SVG icon system. Icons are React components generated from Figma SVGs via [React SVGR](https://react-svgr.com/). Usage:

```tsx
import { Icon } from "@zo/assets/icons";

<Icon name="Calendar" size={24} fill="#FFF" />
```

### `@zo/definitions`
TypeScript type definitions shared across all apps — auth types, general entity types, API response shapes.

### `@zo/utils`
Shared utilities organized by domain: auth helpers, custom React hooks, Next.js utilities, number/string formatting, and Web3 utilities.

---

## Environment Variables

Each app uses three environment files:

| File | Purpose |
|------|---------|
| `.env` | Production variables |
| `.env.local` | Local development (gitignored) |
| `.env.staging` | Staging environment |

Key variables per app:
- `APP_ID` — Unique app identifier (assigned by backend team)
- `NEXT_BASE_PATH` — Base path for the app

---

## Getting Started

### Prerequisites

- **Node.js** v18
- **Yarn** (latest)
- Familiarity with React, Next.js, Tailwind CSS, TypeScript, Nx, React Query v3

### Development

```bash
# Clone
git clone https://github.com/ZoHouse/zo.xyz.git
cd zo.xyz

# Install dependencies
yarn install

# Serve a specific app
yarn nx serve <app-name>
# Example: yarn nx serve dashboard

# Build a specific app
yarn nx build <app-name>

# Build for staging
yarn nx build <app-name> --configuration=staging
```

---

## Creating a New App

1. Run `yarn nx g @nx/next:app {APP_NAME}` to scaffold a base Next.js app
2. Copy `.env*` files from the `admin` app
3. Update `APP_ID` and `NEXT_BASE_PATH` for the new app
4. Copy `next.config.js`, `postcss.config.js`, and `tailwind.config.js` from `admin`
5. Add PostCSS config path in `project.json` under `targets → build → options`:
   ```json
   "postcssConfig": "apps/{APP_NAME}/postcss.config.js"
   ```
6. Set port in `project.json` under `targets → serve → options`:
   ```json
   "port": {NEXT_PORT_NUMBER}
   ```
7. Add staging configuration in `project.json` for both `build` and `serve` targets
8. Ensure `pages/` is inside `src/`
9. Reset `style.css` to Tailwind base imports with Zo dark theme defaults:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   html, body, #__next, main > [data-rk] {
     @apply h-full w-full bg-zui-dark text-zui-white;
   }
   ```

---

## Adding SVG Icons

1. Copy SVG from Figma (note dimensions, e.g. 24x24)
2. Paste into [React SVGR Playground](https://react-svgr.com/) with settings: Dimensions, Icon, TypeScript, Ref, Memo
3. Create a new `.tsx` file in `libs/assets/icons/src/lib/`
4. Set `width`, `height`, `viewBox` to match Figma dimensions
5. Set `fill={props.fill || '#FFF'}` on child elements
6. Add the import to `index.tsx` alphabetically and register in the `icons` array

---

## Contributing

1. Fork and create a feature branch
2. Follow the per-app structure conventions
3. Use shared libraries (`@zo/auth`, `@zo/utils`, `@zo/assets`) — don't duplicate logic
4. Test locally with `yarn nx serve <app>`
5. Open a PR against `main`

---

## Related Docs

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Full system architecture
- [DASHBOARD.md](../DASHBOARD.md) — Dashboard app deep dive
- [NEW_USER_FUNNEL.md](../NEW_USER_FUNNEL.md) — Auth flow documentation
- [ZO_OS.md](../ZO_OS.md) — Zo OS project overview
