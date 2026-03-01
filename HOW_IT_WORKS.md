# CreatorOS — How Everything Works

> **Buzzstack / CreatorOS** — A creator-first business management platform for managing sponsorships, revenue, invoices, AI assistance, and business health.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Authentication](#authentication)
5. [The Deal Pipeline — How It Works](#the-deal-pipeline)
6. [Pipeline → Revenue Flow](#pipeline--revenue-flow)
7. [Invoicing System](#invoicing-system)
8. [Revenue Tracking](#revenue-tracking)
9. [Business Health Dashboard](#business-health-dashboard)
10. [AI Features (Gemini)](#ai-features-gemini)
11. [Negotiation Memory](#negotiation-memory)
12. [Deliverable Lock System](#deliverable-lock-system)
13. [Content Compose & Calendar](#content-compose--calendar)
14. [Brand Management](#brand-management)
15. [Team Handling — Current Status](#team-handling--current-status)
16. [Platform Connections — Current Status](#platform-connections--current-status)
17. [Database Schema](#database-schema)
18. [API Reference](#api-reference)
19. [Environment Variables](#environment-variables)
20. [Known Gaps & Future Work](#known-gaps--future-work)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 (custom palette), React Query v5, React Router v6 |
| **Charts** | Recharts |
| **Drag & Drop** | react-beautiful-dnd |
| **Backend** | Node.js, Express 4 |
| **Database** | PostgreSQL via Sequelize 6 (auto-falls back to SQLite for local dev) |
| **AI** | Google Gemini 2.0 Flash (free tier — 15 RPM, 1500 RPD) |
| **Auth** | JWT (JSON Web Token) |
| **Currency** | INR (₹) throughout |

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Navy | `#0C2340` | Primary text, dark backgrounds |
| Teal | `#1B98A0` | Buttons, accents, positive |
| Cyan | `#00D4F5` | Highlights, links, badges |
| Sand | `#E8DCC8` | Borders, soft backgrounds |

---

## Project Structure

```
backend/
  src/
    index.js              ← Express server entry point
    config/database.js    ← Sequelize config (Postgres or SQLite fallback)
    models/               ← All Sequelize models + associations (index.js)
    routes/               ← REST API endpoints
    services/gemini.js    ← AI service (all 6 Gemini functions)
    middleware/auth.js    ← JWT auth middleware
    jobs/                 ← Cron scheduler for auto-publishing posts
    database/             ← Migration & seed scripts

frontend/
  src/
    main.jsx              ← React entry
    App.jsx               ← React Router setup
    api/client.js         ← Axios API client (all endpoints)
    components/Layout.jsx ← Sidebar nav
    pages/                ← All page components
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (already exists with defaults):

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/creatoros
JWT_SECRET=creatoros-jwt-secret-hackathon-2024
GEMINI_API_KEY=your-gemini-api-key       # Get from https://aistudio.google.com/apikey
```

> **No Postgres?** The app auto-falls back to SQLite (file: `backend/data/creatoros.sqlite`). No config needed.

```bash
npm run dev        # Start with nodemon (auto-reload)
# or
npm start          # Production start
```

The server will:
- Connect to the database
- Auto-create all tables (`sequelize.sync()`)
- Start on port 3000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

### 3. Get a Gemini API Key (FREE)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key into your `.env` as `GEMINI_API_KEY`
4. Free tier: **15 requests/minute**, **1500 requests/day** — more than enough for development and demo

---

## Authentication

- **Register**: `POST /api/auth/register` — creates user, returns JWT
- **Login**: `POST /api/auth/login` — validates credentials, returns JWT
- **All other routes** require `Authorization: Bearer <token>` header
- Token is stored in `localStorage` on the frontend
- Auto-redirects to `/login` on 401

---

## The Deal Pipeline

This is the core of the app. A **Deal** represents a brand sponsorship opportunity.

### Deal Stages (in order)

```
inbound → qualified → negotiation → contract_sent → in_production → client_review → posted → invoice_sent → paid
                                                                                                              ↘ declined (at any point)
```

| Stage | Meaning |
|-------|---------|
| `inbound` | New lead / email received |
| `qualified` | Verified as legitimate opportunity |
| `negotiation` | Discussing rate, deliverables, terms |
| `contract_sent` | Contract/agreement sent to brand |
| `in_production` | Content is being created |
| `client_review` | Brand is reviewing the content |
| `posted` | Content published on platform |
| `invoice_sent` | Invoice sent to brand for payment |
| `paid` | Payment received ✅ |
| `declined` | Deal fell through ❌ |

### How it works in the UI

- **Pipeline page** (`/pipeline`): Kanban board with drag-and-drop columns for each stage
- Drag a deal card from one column to another → calls `PATCH /api/deals/:id/stage`
- Click a deal card → opens **Deal Detail** page

### Auto-timestamps

When a deal moves to certain stages, timestamps are automatically recorded:
- `contract_sent` → sets `contract_sent_at`
- `contract_signed` → sets `contract_signed_at`
- `invoice_sent` → sets `invoice_sent_at`
- `paid` → sets `payment_received_at`

These show up as a **Timestamp Trail** on the Deal Detail page.

---

## Pipeline → Revenue Flow

**⚠️ Important: The pipeline and revenue are currently TWO SEPARATE systems.**

### How it works now:

```
Deal Pipeline (deals table)          Revenue Tracking (revenue_entries table)
┌─────────────────────┐              ┌──────────────────────────┐
│ Deal: "Nike Q3"     │              │ Revenue Entry:            │
│ Value: ₹50,000      │   MANUAL     │ Source: "sponsorship"     │
│ Stage: "paid"       │ ──────────→  │ Amount: ₹50,000          │
│ Brand: Nike         │   USER ADD   │ Brand: Nike              │
└─────────────────────┘              │ Deal: Nike Q3            │
                                     └──────────────────────────┘
```

### What this means:

1. When a deal reaches the `paid` stage, **revenue is NOT automatically recorded**
2. The user must **manually add a revenue entry** on the Revenue page (`/revenue`)
3. Revenue entries CAN be linked to a deal (`deal_id` field) and brand (`brand_id` field), but it's optional
4. Revenue entries support multiple source types beyond just sponsorships:
   - `sponsorship` — brand deals
   - `affiliate` — affiliate commission
   - `adsense` — ad revenue
   - `membership` — Patreon, YouTube membership
   - `product` — merch, digital products
   - `consulting` — consulting fees
   - `other`

### Why it's manual (not auto):

- A deal's `total_value` is the agreed amount, but the **actual payment** may differ (partial payment, bonus, deductions)
- Creators have revenue from MANY sources beyond deals (adsense, affiliate, products)
- Revenue needs a specific `date` for financial tracking
- A single deal might result in multiple payments over time

### What shows on the Revenue page:

- **Summary cards**: Breakdown by source type
- **Monthly chart**: Bar chart of revenue by month (last 6 months)
- **By platform**: Revenue split by platform (YouTube, Instagram, etc.)
- **Forecast card**: Predicts next month based on last 3 months' average
- **All entries table**: Full list with filter by source type

### What shows on the Dashboard:

- **Revenue this month**: Sum of all revenue entries this month
- **Month-over-month growth**: % change vs last month
- **Pipeline value**: Sum of `total_value` of all active deals (NOT revenue — this is expected future revenue)
- **Outstanding invoices**: Sent but unpaid invoice total

---

## Invoicing System

### Flow:

```
Create Invoice → Draft → Sent → Paid
                           ↘ Overdue (if past due date)
```

- Invoices can be linked to a Deal (auto-fills amount from deal value)
- Auto-generates `invoice_number` (e.g., `INV-20240115-abc1`)
- Status transitions via buttons on the Invoices page
- **Overdue detection**: If an invoice has status `sent` and `due_date` is in the past, a warning banner appears

### Invoice statuses:

| Status | Meaning |
|--------|---------|
| `draft` | Created but not yet sent |
| `sent` | Sent to brand, awaiting payment |
| `paid` | Payment received |
| `overdue` | Past due date, still unpaid |
| `cancelled` | Cancelled/voided |

---

## Revenue Tracking

Revenue is tracked separately from deals because creators have **multiple income streams**.

### Revenue Entry fields:

| Field | Description |
|-------|-------------|
| `source_type` | sponsorship, affiliate, adsense, membership, product, consulting, other |
| `source_name` | Description (e.g., "Nike Q3 Campaign") |
| `amount` | Amount in INR |
| `date` | Date of revenue |
| `platform` | youtube, instagram, linkedin, twitter, tiktok, other |
| `brand_id` | Optional link to a Brand |
| `deal_id` | Optional link to a Deal |

### Revenue Summary API (`GET /api/revenue/summary`):

Returns aggregated data:
- `total` — all-time revenue
- `by_month` — monthly breakdown
- `by_source` — breakdown by type (sponsorship, adsense, etc.)
- `by_platform` — breakdown by platform
- `by_brand` — top brands by revenue

### Revenue Forecast API (`GET /api/revenue/forecast`):

Simple moving average of the last 3 months → predicts next month.

---

## Business Health Dashboard

The `/health` page computes a **health score (0-100)** based on 6 metrics:

| Metric | Weight | How It's Calculated |
|--------|--------|-------------------|
| Revenue Diversification | 20% | Inverse of HHI (Herfindahl-Hirschman Index) by brand |
| Brand Diversity | 15% | Number of active brands × 15 (capped at 100) |
| Income Stability | 20% | 1 - coefficient of variation of monthly revenue |
| Pipeline Health | 15% | Active deal count × 10 + win rate × 0.5 |
| Payment Health | 15% | % of invoices with status "paid" |
| Delivery Rate | 15% | % of deliverables with status "completed" or "posted" |

### Additional features:

- **Cash Flow Snapshot**: Pending invoices, near-payment deals, pipeline expected value, avg monthly revenue
- **Brand Renewal Tracker**: Brands with last collaboration >60 days ago but <365 days, warmth ≥40
- **Risk Alerts**: Auto-generated warnings (high concentration, overdue invoices, volatile income, low pipeline, low diversity)

---

## AI Features (Gemini)

All AI is powered by **Google Gemini 2.0 Flash** (free tier).

| Feature | Endpoint | What It Does |
|---------|----------|--------------|
| **Email Parser** | `POST /api/ai/parse-email` | Extracts brand name, budget, deliverables, dates from a sponsorship email |
| **Rate Advisor** | `POST /api/ai/suggest-rate` | Suggests low/mid/high rate based on creator profile & brand history |
| **Response Drafter** | `POST /api/ai/draft-response` | Writes a professional email reply based on deal context |
| **Content Repurposer** | `POST /api/ai/repurpose` | Rewrites content for a different platform |
| **Brief Generator** | `POST /api/ai/generate-brief` | Creates a full content brief (outline, dos/don'ts, hashtags, CTA ideas) |
| **Negotiation Coach** | `POST /api/ai/negotiation-coach` | Analyzes brand history + past notes → recommends rate, strategy, walk-away threshold |

### How AI is accessed in the UI:

On the **Deal Detail page** (`/deals/:id`), there's a sticky right panel with 5 AI tabs:
1. **Parse** — Paste a brand email, extract deal info
2. **Rate** — Get rate suggestion for this deal
3. **Draft** — Draft a reply email
4. **Brief** — Generate content brief from deal context
5. **Coach** — Get negotiation strategy based on brand history

All AI interactions are logged to the `ai_interactions` table for history.

---

## Negotiation Memory

The **Negotiation Memory** system tracks notes and insights per brand across all deals.

### How it works:

- Each `NegotiationNote` has: `brand_id`, `deal_id` (optional), `note_type`, `content`
- Note types: `budget_range`, `discount`, `payment_terms`, `revision_demand`, `rate_card`, `general`
- On the Deal Detail page, the Negotiation Memory panel shows **all notes for that brand** (not just the current deal)
- This means if you've dealt with Nike before, you'll see all past negotiation history when working on a new Nike deal
- The AI Coach tab also pulls these notes to give smarter advice

### Endpoints:

- `GET /api/negotiations?brand_id=...` — Get all notes for a brand
- `POST /api/negotiations` — Add a note
- `DELETE /api/negotiations/:id` — Remove a note

---

## Deliverable Lock System

Once a deal reaches the contract stage, deliverables should be "locked" to prevent accidental changes.

### How it works:

- Each Deliverable has: `locked` (boolean), `locked_at` (timestamp), `locked_by` (user name)
- **Individual lock**: `PATCH /api/deals/:dealId/deliverables/:id/lock` — toggles lock on one deliverable
- **Bulk lock**: `POST /api/deals/:dealId/lock-all` — locks all unlocked deliverables in a deal
- Locked deliverables **cannot have their status changed** (returns 403 error)
- In the UI: locked deliverables show a 🔒 icon, yellow highlight, and greyed-out status controls
- "Lock All" button appears on the Deal Detail page when the deal stage is beyond negotiation

---

## Content Compose & Calendar

### Compose (`/compose`):

- Write content posts with a title, body, and media URL
- Assign to a deal and target platforms
- Schedule for future publication (or draft)
- Posts have per-platform tracking (via `PostPlatform` model)

### Calendar (`/calendar`):

- Month view showing all scheduled/published posts
- Posts color-coded by status (draft, scheduled, published)

### Auto-publish Scheduler:

A `node-cron` job runs every minute, checks for posts with `status = scheduled` and `scheduled_at <= now`, and marks them as `published`. (Actual platform API publishing is a future feature.)

---

## Brand Management

The **Brands page** (`/brands`) manages your brand relationships.

### Brand fields:

| Field | Description |
|-------|-------------|
| `name` | Brand name |
| `website` | Brand website |
| `industry` | e.g., "Tech", "Fashion" |
| `contact_name` | POC name |
| `contact_email` | POC email |
| `total_deals` | Cumulative deal count |
| `total_revenue` | Cumulative revenue from this brand |
| `warmth_score` | 0-100, how "warm" the relationship is |
| `payment_reliability` | "excellent", "good", "average", "poor", "unknown" |
| `last_collaboration_date` | Date of last deal completion |

### Auto brand creation:

When creating a deal, if you type a brand name that doesn't exist, the backend **auto-creates** the brand record.

---

## Team Handling — Current Status

### ⚠️ There is NO team/multi-user system currently.

The app is **single-user per account**. Here's what that means:

- Each user registers their own account
- All data (deals, brands, revenue, invoices) belongs to `user_id`
- There is no concept of "teams", "organizations", or "shared workspaces"
- There is no role-based access (admin, editor, viewer)
- There is no team member invitation system

### Why:

The Buzzstack blueprint mentions "Team Contribution & Management", but implementing it requires:
- Organization/workspace model
- Invitation system (email invite → accept → join org)
- Role-based permissions (who can edit deals, who can only view)
- Activity attribution (who did what)
- Shared vs personal dashboards

This was explicitly **deferred** from the current scope as it requires significant architectural changes (multi-tenancy).

### What would need to change for teams:

1. Add `Organization` model with `members` join table
2. Add `role` field (admin/editor/viewer) to membership
3. Change all queries from `user_id` to `organization_id`
4. Add invitation flow (invite by email → accept → join)
5. Add permission middleware
6. Add team activity feed
7. Shared dashboards with role-based visibility

---

## Platform Connections — Current Status

### ⚠️ Platform OAuth is NOT functional (deferred).

The app has **UI scaffolding** for connecting platforms (YouTube, Instagram, LinkedIn, Twitter), but:
- OAuth flows require **app approval** from each platform (Meta, Google, etc.)
- Each platform has different review processes (weeks/months)
- The connection routes exist but need real OAuth client IDs

### What's partially built:

- `PlatformConnection` model — stores tokens per platform
- `/connections` route — list/disconnect
- `/gmail` route — Gmail OAuth for scanning sponsorship emails
- Service files exist: `youtube.js`, `instagram.js`, `linkedin.js`, `twitter.js`

### What would need real API keys:

| Platform | What It Enables |
|----------|----------------|
| Gmail | Scan inbox for sponsorship emails → auto-create deals |
| YouTube | Fetch channel stats, auto-publish videos |
| Instagram | Post stories/reels, fetch engagement |
| LinkedIn | Publish posts, fetch profile stats |
| Twitter | Tweet, fetch analytics |

---

## Database Schema

### Models & Key Relationships:

```
User ──┬── Brand ──── Deal ──┬── Deliverable
       │                     ├── Invoice
       │                     ├── ContentPost ── PostPlatform
       │                     ├── RevenueEntry
       │                     ├── AiInteraction
       │                     └── NegotiationNote
       ├── RevenueEntry
       ├── Invoice
       ├── PlatformConnection
       ├── ContentPost
       └── AiInteraction
```

### Key associations:

- **User** has many: Brands, Deals, Revenue, Invoices, Posts, Connections
- **Brand** has many: Deals, Revenue, NegotiationNotes
- **Deal** has many: Deliverables, Invoices, Revenue, Posts, AI Interactions, NegotiationNotes
- **Deal** belongs to: User, Brand
- **ContentPost** has many: PostPlatforms (multi-platform publishing)

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Brands
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | List all brands |
| POST | `/api/brands` | Create brand |
| GET | `/api/brands/:id` | Get brand details |
| PUT | `/api/brands/:id` | Update brand |
| DELETE | `/api/brands/:id` | Delete brand |

### Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List deals (filter by stage, brand_id) |
| POST | `/api/deals` | Create deal |
| GET | `/api/deals/:id` | Get deal with deliverables & invoices |
| PUT | `/api/deals/:id` | Update deal |
| DELETE | `/api/deals/:id` | Delete deal |
| PATCH | `/api/deals/:id/stage` | Move deal to new stage |

### Deliverables (sub-routes of deals)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals/:dealId/deliverables` | List deliverables |
| POST | `/api/deals/:dealId/deliverables` | Create deliverable |
| PUT | `/api/deals/:dealId/deliverables/:id` | Update deliverable |
| DELETE | `/api/deals/:dealId/deliverables/:id` | Delete deliverable |
| PATCH | `/api/deals/:dealId/deliverables/:id/status` | Change status (blocked if locked) |
| PATCH | `/api/deals/:dealId/deliverables/:id/lock` | Toggle lock |
| POST | `/api/deals/:dealId/lock-all` | Lock all deliverables |

### Revenue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/revenue` | List entries (filter by source_type, date range) |
| POST | `/api/revenue` | Create entry |
| PUT | `/api/revenue/:id` | Update entry |
| DELETE | `/api/revenue/:id` | Delete entry |
| GET | `/api/revenue/summary` | Aggregated summary (by month, source, platform, brand) |
| GET | `/api/revenue/forecast` | Next month forecast |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| PATCH | `/api/invoices/:id/status` | Change status (draft→sent→paid/overdue) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard summary |
| GET | `/api/analytics/pipeline` | Pipeline analytics (win rate, by stage) |
| GET | `/api/analytics/brands` | Brand analytics |
| GET | `/api/analytics/revenue` | Monthly revenue data |
| GET | `/api/analytics/health` | Business health score + all metrics |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/parse-email` | Parse sponsorship email |
| POST | `/api/ai/suggest-rate` | Rate suggestion |
| POST | `/api/ai/draft-response` | Draft reply email |
| POST | `/api/ai/repurpose` | Repurpose content for another platform |
| POST | `/api/ai/generate-brief` | Generate content brief |
| POST | `/api/ai/negotiation-coach` | Negotiation strategy advice |

### Negotiations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/negotiations` | List notes (filter by brand_id, deal_id) |
| POST | `/api/negotiations` | Create note |
| DELETE | `/api/negotiations/:id` | Delete note |

### Posts & Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/publish` | Publish post |
| GET | `/api/posts/calendar` | Calendar view data |

### Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connections` | List connected platforms |
| DELETE | `/api/connections/:platform` | Disconnect platform |
| GET | `/api/connections/:platform/auth` | Get OAuth URL |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: 3000) |
| `FRONTEND_URL` | No | CORS origin (default: http://localhost:5173) |
| `DATABASE_URL` | No | PostgreSQL URL (falls back to SQLite if not set / unavailable) |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key (*AI features won't work without it) |
| `GMAIL_CLIENT_ID` | No | Gmail OAuth (for email scanning) |
| `GMAIL_CLIENT_SECRET` | No | Gmail OAuth secret |

---

## Known Gaps & Future Work

### Not Implemented (deferred):

| Feature | Reason |
|---------|--------|
| **Team Management** | Requires multi-tenant architecture overhaul |
| **Platform OAuth** | Requires platform app approvals (weeks/months) |
| **Auto Revenue from Deals** | Revenue is manual; could add auto-create on deal → paid |
| **Brand Discovery Marketplace** | Needs external brand database |
| **Audience Psychographic Intelligence** | Needs connected platform analytics data |
| **Smart Media Kit Builder** | Complex PDF/export generation |

### Could Be Added Quickly:

| Feature | Effort |
|---------|--------|
| Auto-create revenue entry when deal → paid | ~30 min |
| Email notifications for overdue invoices | ~1 hour |
| Export invoices as PDF | ~2 hours |
| Bulk import revenue from CSV | ~1 hour |
| Dark mode toggle | ~2 hours |

---

## Quick Demo Flow

1. **Register** at `/login` → creates your account
2. **Create a brand** on `/brands` → e.g., "Nike", "Adidas"
3. **Create a deal** on `/pipeline` → "Nike Q3 Reel", ₹50,000
4. **Drag the deal** through pipeline stages (or use Deal Detail page)
5. **Add deliverables** on the deal detail page → "1x Instagram Reel"
6. **Use AI**: Paste a brand email → get parsed deal info, rate suggestion, draft reply
7. **Lock deliverables** after contract is signed
8. **Create an invoice** on `/invoices` → link to the deal
9. **Mark invoice as paid** → then add revenue entry on `/revenue`
10. **Check `/health`** → see your business health score

---

*Last updated: March 2026*
