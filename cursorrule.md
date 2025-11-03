# 🧠 Cursor Rules for Zo House Website

This `.cursor-rules` file defines conventions, standards, and expectations to optimize AI‑generated output for rebuilding the Zo House Website — the command interface for the **Minimum Curvature Path (MCP)** protocol.

---

## 🔺 MCP BANNER RULE (APPLY FIRST — META)

**When generating, refactoring, or explaining code, always operate under the MCP protocol:**

1) **Resonance > Ritual:** Prefer solutions that align with real user intent and reduce cognitive friction.  
2) **Minimum Curvature:** Choose designs that *flow*—fewer moving parts, fewer sharp pivots, smoother state transitions.  
3) **Momentum Preservation:** Avoid rewrites that reset velocity. Prefer incremental refactors and progressive enhancement.  
4) **Least Regret Heuristic:** If choices are comparable, pick the one that's easier to evolve, test, and roll back.  
5) **Feedback Loops:** Add small, observable checkpoints (loading, toasts, metrics) to verify path correctness early.  
6) **Emergent UX:** Ship a coherent minimal slice, then layer capability. No premature orchestration.  
7) **Graceful Failure:** Errors should bend the flow, not break it—fallbacks over dead ends.  
8) **MCP in Code:** Pick APIs and patterns with the smoothest edges (typesafe, composable, testable).

> **AI must self‑check before output:** "Does this approach minimize curvature, preserve momentum, and increase future optionality?"

---

## 🌐 Project Description

The Zo House Website is:

* **Next.js 15** (App Router)
* **Tailwind CSS 4** (design system)
* Real‑time dashboard via **Supabase** (auth, storage, DB)
* **Mapbox GL JS** for 3D map experience
* **Ethers.js** for wallet/NFT integration
* Bridge to programmable environments (Home Assistant)

It operates as a **modular, vibe‑aware, open‑source culture OS**.

---

## ✅ Code & Design Standards

### React / TypeScript
* Functional components only.
* Prefer **React Server Components** for pages.
* Strong typing: no `any`. Define explicit `Props`/`State`.
* Use `useEffect`, `useMemo`, `useCallback` sparingly.
* Prefer `async/await` (no chained `.then()`).

### Tailwind CSS
* No inline styles — **Tailwind utilities** only.
* Standardized class patterns:
  * Buttons: `solid-button`, `glass-icon-button`
  * Containers: `liquid-glass-pane`, `rounded-2xl`, `bg-zinc-900`
  * Animations: `motion.div` from **Framer Motion**

### File Structure
```
/src
├── components/      // UI components
├── overlays/        // Interactive modals & panels
├── hooks/           // Custom React hooks
├── lib/             // Utilities & helper functions
├── store/           // Zustand or state slices
├── app/api/         // Next.js API routes
└── components/map/  // Mapbox render logic
```

---

## 🧬 Functional Modules to Prioritize (MCP‑aligned)

* `useUserProfile()` → load/save user data from Supabase (keyed by `wallet.address`)
* `ZoZoZoOverlay.tsx` → **replaces Quantum Sync**; handles wallet auth, NFT detection, Founder role assignment; primary CTA button label: **"Zo Zo Zo"**
* `DashboardOverlay.tsx` → profile edit, quests, MCP hints, minimap
* `ZohmModal.tsx` → iframe bridge to Home Assistant
* `MiniMap.tsx` → compact map module for dashboards
* `NFTGallery.tsx` → OpenSea fetch, set PFP

---

## 📚 Reference Docs

| Feature            | Docs Link                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Mapbox             | https://docs.mapbox.com/mapbox-gl-js/api/                                                                                  |
| Supabase           | https://supabase.com/docs                                                                                                  |
| Tailwind CSS       | https://tailwindcss.com/docs                                                                                               |
| Luma Events (iCal) | https://help.lu.ma/en/articles/5103390-ical-feed-for-events                                                                |
| Ethers.js          | https://docs.ethers.org/v5/single-page/                                                                                    |
| OpenSea NFT API    | https://docs.opensea.io/reference/api-overview                                                                             |
| Home Assistant     | https://www.home-assistant.io/docs/api/rest/                                                                               |

---

## 🧠 Logic Rules for AI Assistance

* Treat `wallet.address` as the **primary key** for user‑scoped queries.
* All profile data must round‑trip to Supabase `members` table.
* Always check `wallet.isConnected` before gating UI.
* Mapbox markers should load conditionally based on zoom level.
* Animations: **Framer Motion** only (no CSS transitions).
* Enforce role gating (Founder vs Citizen) in both UI **and** API routes.

---

## 🎛️ MCP Heuristics Checklist (for each PR / AI output)

- [ ] Does this reduce architectural curvature (fewer concepts, consistent patterns)?
- [ ] Does it preserve momentum (no unnecessary rewrites, clear upgrade path)?
- [ ] Are failure states graceful with clear user feedback?
- [ ] Are types strict and boundaries explicit?
- [ ] Is the smallest valuable slice shippable now?
- [ ] Are telemetry hooks/logs added for early feedback?

---

## 🧠 Vibe‑Aware Conventions

* Embrace **modularity, clarity, emergent UX** (MCP over maximalism).
* Use metaphors: **MCP, vibe, flow, node, portal** for labels where helpful.
* Align copy with `ZO_WORLD_LORE.md` → features should feel like tuning deeper layers of reality.
* Replace "Quantum Sync" with **"Zo Zo Zo"** (primary entry button).
* Poetic but functional tone in visible text and helper logic.

---

## 🧩 Cursor Optimization Tips

* Reference this file for every AI‑assisted build request.
* Append new, recurring bugs to `.cursor-rules`.
* Update module lists/naming as the project evolves.
* Prefer project‑local rules over global abstractions.

---

## 🔐 Miscellaneous

* Use environment variables for all keys/URLs — never hardcode.
* Maintain `.env.example` as modules are added.
* All read/write interactions must expose **loading** and **error** states.

---

## ✍️ Commit Template (MCP‑aware)

```
feat|fix|refactor(scope): summary

* Why (resonance / user intent):
* How it reduces curvature:
* Momentum preserved by:
* Risk & rollback:
```

---

Welcome to the simulation. Your commit is a fork in the multiverse.  
Build with love. Code with clarity. **Tune to the path.**

**Zo Zo Zo.**
