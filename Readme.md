# BuzzStack

A comprehensive sponsorship CRM and business operations platform built for content creators. Manage deals, track revenue, coordinate teams, and grow your creator business — all in one place.

## Overview

BuzzStack is the operating system for professional creators. It unifies deal management, content operations, finance tracking, and team collaboration into a single platform. From the first brand email to final payment collection, BuzzStack handles the entire sponsorship lifecycle while providing AI-powered insights to help creators negotiate better and earn more.

## Features

### Deal & Sponsorship Management

- **Unified Creator Inbox**  
  Gmail, Instagram DMs, WhatsApp, and LinkedIn messages in one threaded view. AI automatically creates deal records from conversations, extracting brand details, budgets, and deliverables.

- **Sponsorship Lifecycle Timeline**  
  Track deals through 8 stages from Idea to Renewal. Automated payment alerts, contract expiry reminders, and brand warmth scores keep you on top of every relationship.

- **Deliverables Lock System**  
  Scope is frozen post-contract signing. Any brand-requested changes require formal amendments with full version history and e-signature support. Protects creators from scope creep.

- **Negotiation Memory System**  
  Every brand's historical budget ranges, discount demands, payment delays, and communication patterns are stored and surfaced automatically during negotiations. Never negotiate blind again.

### Content & Team Operations

- **Campaign Node Mapping**  
  Group all content pieces (YouTube videos, Instagram reels, newsletters, podcasts) under unified campaigns. Track revenue per campaign, calculate true ROI, and identify your most profitable content types.

- **Team Revenue Attribution**  
  Measure your team's impact on earnings. Attribute editor contributions to retention rates, thumbnail designer impact on CTR, and scriptwriter influence on watch time and revenue.

- **AI Content Brief Generator**  
  One click transforms a sponsor email into a complete production brief with talking points, brand dos/don'ts, platform-specific formatting requirements, and suggested hooks.

### Finance, Legal & Intelligence

- **Cash Flow Forecasting**  
  Revenue calendar showing expected, confirmed, and overdue payments. Integrated GST estimation, tax planning tools, and Razorpay payment tracking.

- **Business Health Dashboard**  
  Monitor the stability of your creator business with key metrics:
  - Revenue concentration risk (dependency on top brands)
  - Platform dependency score (YouTube vs Instagram vs others)
  - Income volatility index (month-to-month stability)
  - Brand diversity score (industry spread)

- **Legal Toolkit**  
  NDA and contract templates, built-in e-signature, rate calculator based on your metrics, and usage rights management.

- **Brand Marketplace**  
  Curated, trust-first discovery marketplace connecting creators with vetted brands looking for partnerships.

## Tech Stack

### Backend
- Node.js with Express
- SQLite (development) / PostgreSQL (production)
- Sequelize ORM
- JWT authentication
- Claude AI (Anthropic) and Gemini AI (Google)

### Frontend
- React 18 with Vite
- TailwindCSS
- React Query for data fetching
- Recharts for analytics
- React Beautiful DnD for drag-and-drop

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd amd_sling
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Seed the database:
```bash
npm run seed
```

5. Start the backend server:
```bash
npm start
```

6. In a new terminal, install and start the frontend:
```bash
cd frontend
npm install
npm run dev
```

7. Open http://localhost:5173 in your browser

### Demo Account
- Email: `demo@creatoros.com`
- Password: `demo1234`

## Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database (leave commented for SQLite)
# DATABASE_URL=postgresql://user:pass@localhost:5432/buzzstack

# Auth
JWT_SECRET=your-secret-key

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_GEMINI_API_KEY=your-gemini-key

# OAuth (optional)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── database/      # Migrations and seeds
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # External service integrations
│   │   └── index.js       # Server entry point
│   └── data/              # SQLite database file
│
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # Shared components
│   │   ├── pages/         # Page components
│   │   └── main.jsx       # App entry point
│   └── index.html
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Deals & Pipeline
- `GET /api/deals` - List all deals with filters
- `POST /api/deals` - Create deal (manual or AI-extracted)
- `GET /api/deals/:id` - Get deal with deliverables and history
- `PUT /api/deals/:id` - Update deal details
- `PATCH /api/deals/:id/stage` - Move deal through pipeline stages
- `GET /api/deals/:id/deliverables` - Get locked deliverables
- `POST /api/deals/:id/amendments` - Request scope change

### Brands & Relationships
- `GET /api/brands` - List brands with warmth scores
- `POST /api/brands` - Create brand profile
- `GET /api/brands/:id` - Get brand with negotiation history
- `GET /api/brands/:id/history` - Full deal and payment history

### Revenue & Finance
- `GET /api/revenue` - Revenue entries and forecasts
- `GET /api/analytics` - Dashboard metrics and health scores
- `GET /api/invoices` - Invoice management
- `POST /api/invoices` - Generate invoice from deal

### AI Services
- `POST /api/ai/brief` - Generate content brief from email
- `POST /api/ai/negotiate` - Get negotiation suggestions
- `POST /api/ai/extract` - Extract deal from conversation

### Integrations
- `GET /api/gmail/threads` - Unified inbox threads
- `POST /api/connections/:platform` - Connect social platform

## Development

### Running in Development Mode

Backend with auto-reload:
```bash
cd backend
npm run dev
```

Frontend with HMR:
```bash
cd frontend
npm run dev
```

### Database

Reset and reseed the database:
```bash
cd backend
npm run seed
```

## Sponsorship Lifecycle Stages

1. **Idea** - Initial concept or inbound inquiry
2. **Qualified** - Brand vetted, budget confirmed
3. **Negotiation** - Terms being discussed
4. **Contract Sent** - Agreement out for signature
5. **In Production** - Content being created
6. **Review** - Brand approval pending
7. **Posted** - Content live
8. **Invoice Sent** - Payment requested
9. **Paid** - Deal complete
10. **Renewal** - Follow-up opportunity