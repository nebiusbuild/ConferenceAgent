# Concierge — Conference Scheduling AI Agent

## Build Prompt for OpenClaw Agent

You are building **Concierge**, an intelligent conference scheduling and room management platform powered by Claude AI. This is a production-grade Next.js application that acts as an autonomous "executive assistant" named **Jordan** who manages meetings, sends personalized communications, and syncs with CRM systems — all for a luxury conference environment.

---

## The Problem

Conference organizers and sales teams at large corporate events face a brutal coordination problem:

1. **Room scheduling chaos** — Dozens of meetings across multiple rooms, all day, with constant reschedules and cancellations. Double-bookings happen. Rooms sit empty while people wait in hallways.

2. **Communication overhead** — Every meeting needs a confirmation email, a reminder an hour before, and a follow-up after. Sales reps spend more time on logistics than selling. Contacts get confused about where to go and when.

3. **CRM disconnect** — Meetings happen at the conference but never make it back into HubSpot. Deal stages go stale. Follow-up opportunities are lost because nobody logs outcomes.

4. **No single source of truth** — The schedule lives in spreadsheets, the rooms are tracked on whiteboards, contacts are in email threads, and nobody knows what's happening in real-time.

**Concierge solves all of this with a single system** — an AI-powered scheduling dashboard where an autonomous agent named Jordan handles all communication, scheduling, and CRM sync automatically. The operator sees a real-time timeline of every room, every meeting, and every action the agent has taken.

---

## The Product

### What it does

Concierge is a **Next.js 14 dashboard + AI agent backend** with these core capabilities:

1. **Room Timeline Dashboard** — A Gantt-style visualization showing all conference rooms and their meeting blocks across the day. Operators can see availability at a glance, click meetings to inspect details, and quick-book new meetings from the timeline.

2. **Meeting Management** — Full CRUD for meetings with room assignment, contact association, sales rep assignment, status tracking (Pending → Confirmed → Completed / Cancelled / Rescheduling), and conflict detection.

3. **AI Agent (Jordan)** — An autonomous Claude-powered agent that:
   - Sends personalized confirmation emails when meetings are booked
   - Sends 1-hour-before reminders via email and SMS
   - Handles rescheduling by finding available slots and offering alternatives
   - Sends post-meeting follow-up emails with booking links and swag store links
   - Syncs all meeting outcomes to HubSpot CRM
   - Writes like a real human executive assistant — never reveals it's AI

4. **Session & Event Tracking** — Conference sessions (keynotes, panels, workshops, fireside chats) and social events (happy hours, dinners, receptions) are tracked alongside meetings, with attendee registration.

5. **Per-Person Schedule View** — Look up any contact and see their full conference schedule: meetings, sessions they're registered for, and events they're attending — all on one timeline.

6. **Public Display Board** — A kiosk-mode view showing real-time room status (Available / In Use / Up Next) on lobby displays.

7. **Analytics** — Room utilization rates, meeting status breakdown, agent activity metrics, and a timeline of all agent actions.

### Who it's for

- **Conference operations teams** who manage room logistics at multi-day corporate events
- **Sales teams** who need to schedule and track meetings with prospects at conferences
- **Executive assistants** who coordinate VIP meetings during events

---

## Architecture & Tech Stack

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 14** (App Router) | Full-stack React with API routes |
| Language | **TypeScript** (strict) | Type safety everywhere |
| Database | **PostgreSQL** via **Prisma ORM** | Relational data with type-safe queries |
| Realtime | **Supabase** | Real-time subscriptions (optional) |
| Job Queue | **BullMQ** + **Redis** (IORedis) | Scheduled reminders and follow-ups |
| AI | **Claude API** (`@anthropic-ai/sdk`) | Agent reasoning and message generation |
| Email | **Gmail API** (`googleapis`) | Sending/replying to emails as Jordan |
| SMS | **Twilio** | Text message notifications |
| CRM | **HubSpot API** (`@hubspot/api-client`) | Contact and deal sync |
| Auth | **Clerk** (`@clerk/nextjs`) | Dashboard authentication |
| State | **Zustand** | Client-side state management |
| Styling | **Tailwind CSS** | Custom dark luxury design system |
| Package Manager | **pnpm** | Fast, disk-efficient |

### Project Structure

```
ConferenceAgent/
├── app/                          # Next.js App Router
│   ├── globals.css               # Design system CSS variables, fonts, animations
│   ├── layout.tsx                # Root HTML layout
│   ├── display/page.tsx          # Public kiosk display (no auth)
│   ├── (auth)/sign-in/page.tsx   # Clerk auth page
│   └── (dashboard)/              # Authenticated dashboard routes
│       ├── layout.tsx            # Sidebar navigation shell
│       ├── page.tsx              # Timeline + Quick Book (home)
│       ├── meetings/page.tsx     # Meetings table + detail panel
│       ├── sessions/page.tsx     # Conference sessions grid
│       ├── events/page.tsx       # Social events list
│       ├── schedule/page.tsx     # Per-person schedule lookup
│       ├── agent/page.tsx        # Agent activity log + triggers
│       └── analytics/page.tsx    # Utilization charts + metrics
│
├── app/api/                      # API Routes (all server-side)
│   ├── agent/trigger/route.ts    # POST — trigger agent actions manually
│   ├── rooms/route.ts            # GET — list rooms with today's meetings
│   ├── rooms/[id]/slots/route.ts # GET — available time slots for a room
│   ├── meetings/route.ts         # GET/POST — list and create meetings
│   ├── meetings/[id]/route.ts    # GET/PUT/DELETE — single meeting CRUD
│   ├── events/route.ts           # GET/POST — list and create events
│   ├── sessions/route.ts         # GET/POST — list and create sessions
│   ├── schedule/[contactId]/route.ts # GET/POST — person's full schedule
│   └── webhooks/
│       ├── hubspot/route.ts      # POST — HubSpot deal stage changes
│       ├── twilio/route.ts       # POST — inbound SMS handling
│       └── gmail/route.ts        # POST — Gmail push notifications
│
├── components/                   # React components
│   ├── RoomTimeline.tsx          # Gantt-style room availability view
│   ├── MeetingsTable.tsx         # Sortable, filterable meetings table
│   ├── MeetingDetailPanel.tsx    # Slide-out panel with full meeting details
│   ├── QuickBookModal.tsx        # Meeting booking form modal
│   ├── SessionsList.tsx          # Conference sessions grid
│   ├── EventsList.tsx            # Social events with filtering
│   ├── PersonSchedule.tsx        # One person's full conference timeline
│   ├── DisplayBoard.tsx          # Public room status display
│   ├── AgentLog.tsx              # Agent activity feed with stats
│   └── StatsBar.tsx              # Key metric cards
│
├── lib/                          # Shared server/client utilities
│   ├── prisma.ts                 # Singleton Prisma client
│   ├── redis.ts                  # Lazy Redis connection (IORedis)
│   ├── supabase.ts               # Supabase client (public + admin)
│   ├── store.ts                  # Zustand global state
│   ├── utils.ts                  # Formatting, colors, helpers
│   ├── availability.ts           # Room conflict checking + slot suggestions
│   ├── gmail.ts                  # Gmail API (send, reply, read)
│   ├── twilio.ts                 # Twilio SMS sending
│   ├── hubspot.ts                # HubSpot CRM integration
│   ├── jobs/queue.ts             # BullMQ job scheduling (reminders, follow-ups)
│   └── agent/
│       ├── index.ts              # Main agent orchestration (Claude tool use)
│       ├── tools.ts              # Agent tool definitions (6 tools)
│       ├── persona.ts            # Jordan persona prompt + context builder
│       └── templates.ts          # Email/SMS templates
│
├── workers/
│   └── index.ts                  # BullMQ worker process for background jobs
│
├── prisma/
│   ├── schema.prisma             # Full database schema (12 models)
│   └── seed.ts                   # Seed data (rooms, contacts, meetings, sessions, events)
│
├── middleware.ts                  # Auth middleware (Clerk-ready)
├── next.config.js                # External packages config
├── tailwind.config.ts            # Custom design system colors + fonts
├── vercel.json                   # Vercel deployment config
└── package.json                  # Dependencies and scripts
```

---

## Database Schema

The schema has **12 models** with careful indexing:

### Core Models

- **Room** — Conference rooms with name, slug, capacity, type (EXECUTIVE/SALES/BOOTH), floor, and color
- **Meeting** — The central entity. Links a Contact with a SalesRep in a Room at a specific time. Tracks status lifecycle: `PENDING → CONFIRMED → COMPLETED` (or `CANCELLED` / `RESCHEDULING`). Stores HubSpot and Gmail thread IDs for integration continuity.
- **Contact** — Conference attendees with email, phone, company, and optional HubSpot ID
- **SalesRep** — Internal team members who host meetings. Optional Clerk ID for auth binding.

### Conference Models

- **Session** — Conference talks, panels, workshops, keynotes, fireside chats. Has room, time, speakers array, capacity, and track name.
- **Event** — Social events: happy hours, dinners, breakfasts, networking, receptions, after-parties. Has location, dress code, capacity.
- **SessionRegistration** / **EventRegistration** — Many-to-many join tables linking Contacts to Sessions/Events.

### Agent Models

- **AgentLog** — Every action the AI agent takes is logged here. Type (EMAIL/SMS/HUBSPOT_SYNC/RESCHEDULE/FOLLOWUP/REMINDER), channel, message text, status (SENT/DELIVERED/FAILED/AWAITING_REPLY), and raw JSON payload for debugging.

### Key Indexes

```prisma
@@index([roomId, startTime, endTime])  // Fast room availability queries
@@index([status])                       // Filter meetings by status
@@index([contactId])                    // Person schedule lookups
@@index([meetingId])                    // Agent logs per meeting
@@index([type])                         // Filter logs/sessions by type
@@index([createdAt])                    // Chronological log feed
@@index([startTime])                    // Time-based session/event queries
```

---

## The AI Agent System

### How it works

The agent uses Claude's **tool use** capability. When triggered (by a BullMQ job or manual API call), it:

1. Loads the meeting and all related data (contact, room, sales rep)
2. Builds a context prompt with the Jordan persona + task details
3. Sends a single Claude API call with 6 available tools
4. Executes whatever tools Claude decides to use
5. Logs every action to the AgentLog table

### Agent Tools

| Tool | Purpose |
|------|---------|
| `send_email` | Send email via Gmail as Jordan. Handles thread continuity. |
| `send_sms` | Send SMS via Twilio. Under 160 chars. |
| `offer_reschedule_slots` | Find available room slots and send options to contact |
| `confirm_reschedule` | Lock in a new time, update DB, reschedule BullMQ jobs |
| `sync_to_hubspot` | Push meeting data/outcomes to HubSpot CRM |
| `update_meeting_status` | Change meeting status in the database |

### Jordan Persona

Jordan is an executive assistant who writes like a real human:
- First person voice ("I've gone ahead and...", "Just wanted to reach out...")
- Concise emails (max 120 words), casual-but-professional SMS (under 160 chars)
- Uses contact's first name, signs "Best, Jordan"
- No bullet points, no numbered lists
- Mirrors the formality level of inbound replies
- **Never reveals it's an AI** — deflects gracefully if asked

### Task Types

| Type | Trigger | What Jordan Does |
|------|---------|-----------------|
| `CONFIRMATION` | Meeting created | Sends email confirming room, time, who they're meeting |
| `REMINDER` | BullMQ job (1hr before) | Email + optional SMS reminder |
| `RESCHEDULE` | Manual trigger or webhook | Finds slots, sends options, confirms new time |
| `FOLLOWUP` | BullMQ job (15min after end) | Thank-you email with Calendly + swag store links |
| `HUBSPOT_SYNC` | After follow-up or manual | Pushes meeting data and outcome to HubSpot |
| `REPLY` | Gmail webhook | Processes inbound email replies |

### Background Job System

BullMQ workers run as a separate process (`pnpm worker`):
- **Reminder Worker** — Processes reminder jobs, triggers agent with meeting context
- **Follow-Up Worker** — Marks meetings completed, triggers follow-up email + HubSpot sync
- Jobs are scheduled with calculated delays (1hr before start, 15min after end)
- Jobs are cancelled if meetings are cancelled, rescheduled if times change

---

## Design System

The UI follows a **dark luxury aesthetic** — think high-end hotel concierge desk, not SaaS dashboard.

### Color Palette

```
Base:       #0b0f1a  (deep navy-black)
Surface:    #0e1220  (slightly lighter)
Elevated:   #13172a  (card/panel backgrounds)
Border:     #1e2433  (subtle separators)

Gold:       #c9a84c  (primary accent — active states, branding)
Teal:       #7c9fa6  (room colors, secondary)
Sage:       #6aaa8a  (confirmed/success states)
Sienna:     #c67a5a  (rescheduling/warning states)
Lavender:   #8b7ec8  (sessions, tertiary)
Blush:      #d4a5a5  (events, soft accent)

Text:       #e8e4dc  (primary — warm off-white)
Secondary:  #9ca3af  (labels, metadata)
Muted:      #6b7280  (disabled, timestamps)
```

### Typography

- **Display**: Cormorant Garamond (serif) — Logo, headings
- **Body**: DM Sans (sans-serif) — All UI text
- **Mono**: DM Mono — Timestamps, IDs, code

### Component Patterns

- Sidebar navigation with unicode icons (◈ ◎ ▦ ◇ ◫ ⟡ △)
- Active nav items get gold border-left + gold text
- Cards use `bg-elevated` with `border` color borders
- Status badges use color-coded `bg-{color}/20` + `text-{color}`
- Slide-in panels animate from right (`slideInRight 0.3s ease-out`)
- All transitions use `duration-200`

---

## API Routes Reference

### `GET /api/rooms`
Returns all rooms with today's meetings. Supports `?date=YYYY-MM-DD` filter.

### `GET /api/rooms/[id]/slots`
Returns available time slots for a room on a given date. Query params: `date`, `duration` (minutes).

### `GET /api/meetings`
Returns all meetings with includes (contact, room, salesRep). Supports `?status=`, `?date=`, `?search=` filters.

### `POST /api/meetings`
Creates a meeting. Required: `title`, `roomId`, `contactId`, `salesRepId`, `startTime`, `endTime`. Checks room availability, schedules BullMQ reminder/follow-up jobs, triggers agent confirmation.

### `GET/PUT/DELETE /api/meetings/[id]`
Single meeting operations. PUT supports partial updates including status changes. DELETE cancels BullMQ jobs.

### `GET/POST /api/sessions`
Conference session CRUD. Includes registration counts.

### `GET/POST /api/events`
Social event CRUD. Includes registration counts.

### `GET /api/schedule/[contactId]`
Returns a contact's full conference schedule (meetings + session registrations + event registrations).

### `POST /api/schedule/[contactId]`
Register/unregister a contact for sessions or events.

### `POST /api/agent/trigger`
Manually trigger agent actions. Body: `{ type, instruction, meetingId }`.

### Webhooks
- `POST /api/webhooks/hubspot` — Deal stage change notifications
- `POST /api/webhooks/twilio` — Inbound SMS messages
- `POST /api/webhooks/gmail` — Gmail push notification (new email)

---

## Deployment

### Environment Variables Required

```bash
# Database (required)
DATABASE_URL=postgresql://...

# AI Agent (required for agent features)
ANTHROPIC_API_KEY=sk-ant-...

# Redis (required for job queue)
REDIS_URL=redis://...

# Gmail (required for email)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_ADDRESS=jordan@company.com

# Twilio (optional — SMS disabled by default)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_ENABLED=false

# HubSpot (optional — CRM sync)
HUBSPOT_PRIVATE_APP_TOKEN=
HUBSPOT_PORTAL_ID=

# Supabase (optional — realtime)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth (optional — Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
CONFERENCE_TIMEZONE=America/New_York
SWAG_STORE_URL=https://swag.company.com
FOLLOWUP_BOOKING_URL=https://calendly.com/company
```

### Vercel Deployment

The app is configured for Vercel with:
- `vercel.json` for build configuration
- Lazy Redis/BullMQ connections (no connection at build time)
- Server external packages: `bullmq`, `ioredis`, `twilio`, `googleapis`
- Prisma generates at build time via `postinstall` hook

### Running Locally

```bash
pnpm install                 # Install dependencies
pnpm db:push                 # Push schema to database
pnpm db:seed                 # Seed sample data
pnpm dev                     # Start Next.js dev server
pnpm worker                  # Start BullMQ workers (separate terminal)
```

---

## Key Implementation Details

### Room Availability Algorithm (`lib/availability.ts`)

The slot suggestion algorithm:
1. Gets all non-cancelled meetings for the room on the requested day
2. Walks through the day finding gaps between meetings that fit the duration
3. If not enough slots in the preferred room, checks other rooms with equal or greater capacity
4. Returns up to N slots, each with start/end times and room info

### Meeting Lifecycle

```
POST /api/meetings
  → Validate room availability (check conflicts)
  → Create meeting (status: PENDING)
  → Schedule BullMQ reminder job (1hr before start)
  → Schedule BullMQ follow-up job (15min after end)
  → Trigger agent CONFIRMATION task
  → Agent sends email via Gmail as Jordan

[1 hour before meeting]
  → BullMQ fires reminder job
  → Worker triggers agent REMINDER task
  → Agent sends email + optional SMS

[15 minutes after meeting ends]
  → BullMQ fires follow-up job
  → Worker marks meeting COMPLETED
  → Worker triggers agent FOLLOWUP task
  → Agent sends thank-you email with links
  → Worker triggers agent HUBSPOT_SYNC task
  → Agent pushes outcome to HubSpot
```

### Lazy Initialization Pattern

Redis and BullMQ use lazy initialization via Proxy objects so they don't attempt connections during Vercel's build-time static page generation:

```typescript
export const redis = new Proxy({} as IORedis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
```

### State Management (`lib/store.ts`)

Zustand store manages client-side state:
- `meetings` — Current meetings list
- `rooms` — Room list
- `selectedMeetingId` — For detail panel
- `isQuickBookOpen` — Modal state
- `refreshData()` — Fetches fresh data from API

---

## What to Build

You are building this complete system. The codebase is already structured and functional. Your job is to:

1. **Understand every file** — Read the schema, the agent system, the API routes, the components, and the design system. Understand how data flows from the database through the API to the UI, and how the agent orchestrates communication.

2. **Get it running** — Install dependencies, set up the database, seed data, and verify the build passes.

3. **Extend and improve** — Based on the task you're given, implement features, fix bugs, or enhance the system while respecting the existing architecture, patterns, and design language.

4. **Maintain quality** — Keep TypeScript strict, follow the existing code style, use the established design system colors and typography, and ensure all API routes handle errors gracefully.

5. **Test the agent** — The AI agent is the heart of the product. When making changes to the agent system, verify that tool definitions match executor implementations, that all agent actions are logged, and that the Jordan persona is maintained.

This is a production-quality application with real integrations. Treat it as such.
