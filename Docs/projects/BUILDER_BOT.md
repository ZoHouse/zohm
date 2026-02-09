# Zo Builder Bot (`ZoBuilder-bot`)

> **The official community agent for the Zo House builder network.**

- **Repository**: [github.com/ZoHouse/ZoBuilder-bot](https://github.com/ZoHouse/ZoBuilder-bot)
- **Status**: Production (consolidating into main platform)
- **Language**: Python 3.8+
- **Framework**: python-telegram-bot + FastAPI

---

## Overview

A **Telegram bot** that gamifies open-source contributions in the Zo House builder community. It tracks GitHub activity via webhooks, allows peer nominations, computes a **Builder Score**, and posts real-time contribution announcements to the community group.

> **Consolidation note**: This is currently a standalone service. Builder Score and contribution tracking are being integrated into the main web and mobile builds as a native feature.

---

## Architecture

The bot runs as two processes:

1. **Telegram Bot** (`bot.py`) — Handles user commands and interactions via long polling
2. **Webhook Server** (`webhooks.py`) — FastAPI/uvicorn server that receives GitHub webhook events and routes them to the Telegram group

```
GitHub Repos ──webhook──→ FastAPI Server ──→ Telegram Group
                                              ↕
Telegram Users ──commands──→ Bot Process ──→ MongoDB
```

---

## Features

### Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Setup builder profile (Phone OTP via Zo API) |
| `/help` | List all available commands |
| `/profile` | View your profile, Builder Score, and wallet |
| `/nominate @username` | Nominate a fellow builder for recognition |
| `/score` | Check your Builder Score |
| `/leaderboard` | View top builders in the community |

### GitHub Integration

Real-time tracking of GitHub activity across Zo House repositories:

- **Commits** — Announces new pushes to tracked repos
- **Pull Requests** — Announces PR opens, merges, and reviews
- **Issues** — Announces new issues and comments
- **Attribution** — Maps GitHub usernames to Zo IDs in MongoDB

### Builder Score System

Each builder receives a score computed from three dimensions:

| Dimension | Signals |
|-----------|---------|
| **Code** | Commits, pull requests, issues created/resolved |
| **Social** | Nominations received from peers |
| **Engagement** | Telegram activity, participation |

Builders can check scores via `/score` or `/profile`.

### Leaderboard

`/leaderboard` displays top builders ranked by Builder Score, showing wallet address and score publicly.

### Automation

- **Automatic Onboarding** — New Telegram group members are greeted and guided to set up profiles
- **Weekly Recaps** — Automated posts highlighting community achievements and top contributors

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Bot Framework** | python-telegram-bot |
| **Webhook Server** | FastAPI + uvicorn |
| **Database** | MongoDB |
| **Auth** | Zo API (Phone OTP) |
| **Language** | Python 3.8+ |

---

## Project Structure

```
ZoBuilder-bot/
├── bot.py                 # Main Telegram bot (long polling)
├── webhooks.py            # FastAPI webhook server for GitHub
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variable template
└── README.md
```

---

## Environment Variables

Create a `.env` file:

```bash
# Telegram
TELEGRAM_TOKEN=your-bot-token-from-botfather
TELEGRAM_GROUP_ID=your-telegram-group-id

# GitHub
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=zo_builder_bot
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- Telegram Bot token (from [BotFather](https://t.me/BotFather))
- GitHub webhook secret
- MongoDB database
- Public URL endpoint for GitHub webhooks

### Installation

```bash
# 1. Clone
git clone https://github.com/ZoHouse/ZoBuilder-bot.git
cd ZoBuilder-bot

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your values

# 5. Run the bot
python bot.py

# 6. Run webhook server (separate terminal)
uvicorn webhooks:app --reload
```

### Setting Up GitHub Webhooks

1. Go to your GitHub organization/repo settings
2. Navigate to **Webhooks** → **Add webhook**
3. **Payload URL**: Your public server URL (e.g. `https://your-domain.com/webhook`)
4. **Content type**: `application/json`
5. **Secret**: Same as `GITHUB_WEBHOOK_SECRET` in `.env`
6. **Events**: Select:
   - Push events
   - Pull requests
   - Issues
   - Issue comments
7. Ensure webhook is **Active** and save

---

## Builder Score Logic

### Scoring Model

```
Builder Score = Code Score + Social Score + Engagement Score
```

**Code Score** (from GitHub webhooks):
- Commits pushed to tracked repos
- Pull requests opened and merged
- Issues created and resolved

**Social Score** (from Telegram):
- Nominations received via `/nominate @username`
- Peer recognition weight

**Engagement Score** (from Telegram):
- Activity level in the community group
- Participation in discussions

### Querying Scores

```
/score           → View your own Builder Score
/profile         → Full profile with score breakdown
/leaderboard     → Top builders ranked by score
```

---

## Integration Points

- **Zo API** — Phone OTP authentication for builder profile creation
- **GitHub** — Webhook-based real-time activity tracking
- **MongoDB** — Stores builder profiles, scores, nominations, and GitHub mappings
- **Telegram** — Primary interface for all user interactions

---

## Related Docs

- [AGENTS.md](../AGENTS.md) — Bot agents overview
- [SYSTEM_FLOWS.md](../SYSTEM_FLOWS.md) — Auth and governance flows
- [HOSPITALITY_BOT.md](./HOSPITALITY_BOT.md) — Companion bot (housekeeping)
- [ZO_OS.md](../ZO_OS.md) — Zo OS project overview
