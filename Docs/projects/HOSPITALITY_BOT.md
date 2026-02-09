# Hospitality 2.0 Bot

> **Agentic automation microservice for housekeeping and property operations.**

- **Repository**: [github.com/ZoHouse/Hospitality-2.0](https://github.com/ZoHouse/Hospitality-2.0)
- **Status**: Production (consolidating into main web platform)
- **Language**: Python 3.11+
- **Framework**: LangGraph + FastAPI

---

## Overview

A **multi-persona LangGraph agent** that acts as the operating system for Zo House housekeeping staff and house captains. It automates task assignment, shift management, PMS integration, and real-time staff communication via WhatsApp.

> **Consolidation note**: This is currently a standalone service. It is being merged into the main web platform ([game.zo.xyz](./QUESTING_MAP.md)) as an internal operations service rather than a separate deployment.

---

## Architecture

### Agentic Workflow

The system uses a multi-persona LangGraph workflow with intelligent routing:

```
START → ingest → detect_intent → context → route
                                            ├─→ housekeeping → finalize → END
                                            └─→ captain → finalize → END
```

### Personas

**1. Housekeeping Persona** (`agents/personas/housekeeping_persona.py`)
- Task management and completion tracking
- Shift operations (start, end, break)
- PMS queries (check-ins/check-outs)
- Zone task queries

**2. Captain Persona** (`agents/personas/captain_persona.py`)
- Special request creation via natural language
- Task assignment to staff
- Zone oversight
- Issue escalation handling

### Routing Logic

- Captain intents → Captain persona
- Housekeeping intents → Housekeeping persona
- Shared intents (zones, PMS) → Based on `staff_id`:
  - Contains "captain" → Captain persona
  - Otherwise → Housekeeping persona

### Intent Detection

| Category | Intents |
|----------|---------|
| **Housekeeping** | `shift_start`, `task_completion`, `break_request`, `pms_query`, `list_zones`, `zone_task_query` |
| **Captain** | `create_special_request`, `assign_special_request`, `issue_report` |

**Keywords:**
- PMS: "check-in", "check-out", "bookings", "guests"
- Zones: "list zones", "schelling", "kitchenette", "dorm"
- Special requests: "create task", "assign to", "urgent task"

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | Python 3.11+ |
| **AI Framework** | LangGraph (multi-persona agentic workflow) |
| **LLMs** | OpenAI (optional), Groq |
| **API** | FastAPI |
| **Database** | Supabase (PostgreSQL) |
| **Automation** | Playwright (PMS browser automation) |
| **Messaging** | WhatsApp (Whapi.Cloud for groups + Facebook Cloud API for individuals) |
| **Package Manager** | uv |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/agent/conversation` | POST | Agentic conversation (housekeeping/captain) |
| `/agent/captain/special-request` | POST | Captain creates special request (NL) |
| `/tasks/special-request` | POST | Create special request (structured) |
| `/tasks/zones` | GET | List all available zones |
| `/analytics/staff/{staff_id}/time-tracking` | GET | Time analytics for individual staff |
| `/analytics/time-tracking/summary` | GET | All staff time summary |
| `/pms/report` | GET | Fetch daily PMS report |
| `/pms/report/test` | POST | Trigger PMS report manually |

### Example Requests

**Housekeeping staff conversation:**
```bash
curl -X POST http://localhost:8000/agent/conversation \
  -H "Content-Type: application/json" \
  -d '{"staff_id": "HK001", "message": "Show today'\''s check-ins"}'
```

**Captain special request (natural language):**
```bash
curl -X POST http://localhost:8000/agent/captain/special-request \
  -H "Content-Type: application/json" \
  -d '{"captain_id": "captain_001", "message": "Create urgent task: Clean spill in Degen Lounge for HK001"}'
```

**Time analytics:**
```bash
curl http://localhost:8000/analytics/staff/HK001/time-tracking
curl http://localhost:8000/analytics/time-tracking/summary
```

---

## Zone-Based Task Management

### Property Zones (18+)

| Category | Zones |
|----------|-------|
| **Common Areas** | Schelling Point, Flo Zone, Degen Lounge, Photo Booth |
| **Facilities** | Toilets, Kitchenette, Laundry Area, Bio Hack Room |
| **Rooms** | DORM, Park Room, Satoh Room, Bored Room, Private Rooms |
| **Outdoor** | Pickleball Court, Swimming Pool, Smoking Area (420) |
| **Activity** | Activity Area, Zo Studio, Dining Area |

### Zone Task Structure

Each zone has predefined tasks with:

```json
{
  "task_id": "ZONE001",
  "title": "Schelling Point Reset",
  "description": "Clear tables and ashtrays, wipe surfaces...",
  "zone": "Schelling Point",
  "estimated_minutes": 45,
  "priority": "high"
}
```

### Special Requests

Captain can create ad-hoc tasks using natural language. The LLM extracts: title, description, zone, assigned staff, priority, estimated time, and special instructions.

```
"Create urgent task: Fix broken chair in Degen Lounge for HK001, high priority"
```

---

## Staff Management

### Current Roster

| ID | Name | Shift | Status |
|----|------|-------|--------|
| HK001 | Staff Eiyas | Evening (11AM-9PM) | Active |
| HK002 | Staff Anwar | Off duty | Inactive |
| HK003 | Staff Inderjeet | Morning (9AM-7PM) | Active |
| HK004 | Staff Tapas | Mid (10AM-8PM) | Active |
| captain_001 | House Captain | — | Active |

### Shift Coverage

```
9AM  10AM  11AM  12PM  1PM  2PM  3PM  4PM  5PM  6PM  7PM  8PM  9PM
|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
     |     HK001 (Evening) ---------------------------------------->|
     | HK002 (Mid) ---------------------------------------->|
| HK003 (Morning) ---------------------------------------->|
     | HK004 (Mid) ------------------------------------------------>|
```

### Staff Skills

All staff: Dusting, Mopping, Sanitization, Organization, Deep Cleaning.

---

## WhatsApp Integration

### Dual-Number Approach

**1. Whapi.Cloud — Group Management**
- Handles group messages and group-based workflows
- Quick QR code setup, no Meta Business verification
- Webhook: `/webhook/whapi`

**2. Facebook Cloud API — Individual Chats**
- Handles one-on-one staff conversations
- Requires Facebook App credentials
- Webhook: `/webhook/facebook`

### Message Flow

1. Webhook receives incoming message
2. Deduplicates by message ID
3. Filters by allowed groups (if configured)
4. Resolves staff member by matching phone number in Supabase
5. Routes through LangGraph agent
6. Sends response back via appropriate WhatsApp API

---

## PMS Integration

Integrates with eezzee PMS (`live.ipms247.com`) using Playwright browser automation.

### How It Works

1. **Automated Login** — Logs into PMS using credentials from `.env`
2. **API Interception** — Captures the `fetchBookings` API call
3. **Data Extraction** — Parses JSON, filters for today's check-ins/check-outs
4. **WhatsApp Reports** — Sends formatted reports via WhatsApp

### Scheduled Reports

Daily automated reports at 9:00 AM via `scheduler_service.py`.

### Response Format

```json
{
  "report_date": "2025-10-07T13:46:29",
  "check_ins_today": [
    {
      "booking_id": "WTFxZO123",
      "guest_info": { "name": "John Doe", "email": "...", "phone": "..." },
      "room_number": "101",
      "check_in_date": "2025-10-07",
      "check_out_date": "2025-10-09"
    }
  ],
  "total_check_ins": 1,
  "total_check_outs": 0
}
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `housekeeping_staff` | Staff members and their schedules |
| `housekeeping_tasks` | Zone tasks and special requests |
| `housekeeping_zones` | Property zones and areas |
| `task_completions` | Task completion tracking with time analytics |
| `housekeeping_schedules` | Daily staff schedules |

### LangGraph Tables

| Table | Purpose |
|-------|---------|
| `langgraph_checkpoints` | Conversation state persistence |
| `langgraph_checkpoint_writes` | Pending checkpoint writes |

---

## Project Structure

```
zo-bot/
├── src/
│   ├── app/
│   │   └── main.py                # FastAPI endpoints + webhook handlers
│   ├── agents/
│   │   ├── workflows.py           # LangGraph workflow definition
│   │   ├── main_agent.py          # Agent orchestrator
│   │   ├── intent.py              # Intent detection
│   │   ├── context_analyzer.py    # Persona routing
│   │   ├── state.py               # Shared state types
│   │   └── personas/
│   │       ├── housekeeping_persona.py
│   │       └── captain_persona.py
│   ├── models/
│   │   ├── tasks.py               # TaskType, TaskPriority enums
│   │   ├── housekeeping.py        # Zone models, SpecialRequest
│   │   ├── staff.py               # Staff models
│   │   └── pms.py                 # PMS booking models
│   ├── services/
│   │   ├── task_assignment_service.py  # Intelligent task scoring
│   │   ├── pms_service.py         # Playwright PMS automation
│   │   ├── llm_service.py         # LLM integrations
│   │   ├── whapi_service.py       # Whapi.Cloud outgoing messages
│   │   └── scheduler_service.py   # Daily report scheduler
│   └── database/
│       ├── supabase.py            # Supabase client
│       └── checkpoint.py          # LangGraph checkpoint persistence
├── scripts/
│   ├── seed_zone_tasks.py         # Seed 18 zone tasks
│   └── seed_staff_data.py         # Seed 4 staff + 1 captain
└── tests/
```

---

## Environment Variables

```bash
# Supabase (Required)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLMs
OPENAI_API_KEY=optional
GROQ_API_KEY=required

# FastAPI
APP_HOST=0.0.0.0
APP_PORT=8000

# Whapi.Cloud (WhatsApp groups)
WHAPI_API_TOKEN=your-token
WHAPI_ALLOWED_GROUPS=120363XXXX@g.us
WHAPI_API_BASE=https://gate.whapi.cloud

# Facebook Cloud API (WhatsApp individuals)
WHATSAPP_API_BASE=https://graph.facebook.com/v22.0
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# PMS
PMS_URL=https://live.ipms247.com/login/
PMS_USERNAME=Manager
PMS_PASSWORD=your-password
PMS_PROPERTY_CODE=55580
WHATSAPP_RECIPIENT_NUMBER=+919876543210

# Webhook
WEBHOOK_SECRET=your-secret
```

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/ZoHouse/Hospitality-2.0.git
cd Hospitality-2.0

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Install dependencies
uv sync

# 4. Start server
uv run uvicorn app.main:app --reload --app-dir src

# 5. View API docs
# http://localhost:8000/docs
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Import errors | Export `PYTHONPATH=src` or run `uv sync` |
| Supabase connection | Verify URL and service role key in `.env` |
| Playwright browser not found | Auto-installs on first run; manual: `playwright install chromium` |
| Persona not routing | Check `staff_id` format: captain IDs contain "captain", HK IDs are `HK00X` |
| Intent not detected | Review keywords in `src/agents/intent.py` |
| Zone not recognized | Must match `ZoneArea` enum exactly (case-sensitive) |

---

## Related Docs

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Full system architecture
- [NODE_ADMIN_GUIDE.md](../NODE_ADMIN_GUIDE.md) — Node and zone management
- [SYSTEM_FLOWS.md](../SYSTEM_FLOWS.md) — System integration flows
