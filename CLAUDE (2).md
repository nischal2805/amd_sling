# CreatorOS — Hackathon MVP (2-Day Build)

**What this is:** A sponsorship CRM + revenue intelligence + content publishing platform for content creators.
**What to build:** Backend API first, minimal functional frontend second.
**What NOT to build:** TikTok, team management, WhatsApp, competitor analysis, benchmarking, file storage, e-signatures. Strip it all.

---

## 🎯 THE CORE MVP — 4 Things

1. **Sponsorship Deal Pipeline** — Kanban-style CRM to manage brand deals from inbound → paid
2. **Revenue Intelligence Dashboard** — Track income, see which content makes money
3. **AI Deal Assistant** — Claude parses sponsorship emails, drafts responses, suggests rates
4. **Content Publishing** — Write, schedule, and publish to YouTube, Instagram, LinkedIn, Twitter/X from one place

Everything else is out of scope. If it's not in these 4, don't build it.

---

## 📁 PROJECT STRUCTURE

```
creatoros/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── controllers/     # Business logic
│   │   ├── services/
│   │   │   ├── claude.js        # Claude AI integration (PRIORITY)
│   │   │   ├── gmail.js         # Gmail OAuth + reading
│   │   │   ├── youtube.js       # YouTube Data API v3
│   │   │   ├── instagram.js     # Instagram Graph API
│   │   │   ├── linkedin.js      # LinkedIn Posts API
│   │   │   └── twitter.js       # Twitter/X API v2
│   │   ├── jobs/
│   │   │   └── publishScheduler.js  # Cron job for scheduled posts
│   │   ├── models/          # Sequelize models
│   │   ├── middleware/      # auth, error handling
│   │   └── config/
│   ├── database/
│   │   └── migrations/
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Revenue overview
    │   │   ├── Pipeline.jsx        # Deal Kanban board
    │   │   ├── DealDetail.jsx      # Single deal view
    │   │   ├── Brands.jsx          # Brand list
    │   │   ├── Revenue.jsx         # Revenue tracking
    │   │   ├── Compose.jsx         # Write + publish content
    │   │   ├── Calendar.jsx        # Scheduled posts calendar view
    │   │   └── Connections.jsx     # Connect social accounts
    │   ├── components/
    │   └── api/                    # Axios API client
    └── package.json
```

---

## 🗄️ DATABASE SCHEMA (MVP Only)

Use PostgreSQL. Run migrations in this order (respect foreign key dependencies).

### Migration 1: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  niche VARCHAR(100),
  primary_platform VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
```

### Migration 2: brands
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  industry VARCHAR(100),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  -- Computed intelligence (update via triggers or app logic)
  total_deals INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  average_deal_value DECIMAL(10, 2),
  average_payment_days INTEGER,
  payment_reliability VARCHAR(20) DEFAULT 'unknown', -- excellent, good, fair, poor, unknown
  warmth_score INTEGER DEFAULT 50, -- 1-100
  last_collaboration_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_brands_user ON brands(user_id);
```

### Migration 3: deals
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),
  title VARCHAR(255) NOT NULL,
  total_value DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  stage VARCHAR(50) DEFAULT 'inbound',
  -- stages: inbound, qualified, negotiation, contract_sent, in_production, client_review, posted, invoice_sent, paid, declined
  description TEXT,
  posting_deadline DATE,
  start_date DATE,
  end_date DATE,
  -- Gmail integration
  email_thread_id VARCHAR(255),
  -- Timestamps for stage tracking
  contract_sent_at TIMESTAMP,
  contract_signed_at TIMESTAMP,
  invoice_sent_at TIMESTAMP,
  payment_received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_deals_user ON deals(user_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_brand ON deals(brand_id);
```

### Migration 4: deliverables
```sql
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- youtube_video, instagram_reel, tiktok_video, instagram_post, blog_post, newsletter, podcast, custom
  platform VARCHAR(50),
  status VARCHAR(50) DEFAULT 'not_started',
  -- statuses: not_started, in_progress, pending_review, approved, posted, completed
  deadline DATE,
  requirements TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_deliverables_deal ON deliverables(deal_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
```

### Migration 5: revenue_entries
```sql
CREATE TABLE revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  source_type VARCHAR(50) NOT NULL,
  -- types: sponsorship, affiliate, adsense, membership, product, consulting, other
  source_name VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  date DATE NOT NULL,
  platform VARCHAR(50), -- youtube, instagram, tiktok, linkedin, twitter
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_revenue_user_date ON revenue_entries(user_id, date);
CREATE INDEX idx_revenue_source ON revenue_entries(source_type);
```

### Migration 6: invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  due_date DATE,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invoices_deal ON invoices(deal_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

### Migration 7: platform_connections (Gmail + all social platforms)
```sql
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- gmail, youtube, instagram, linkedin, twitter
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  platform_email VARCHAR(255),
  -- Platform-specific extras
  instagram_user_id VARCHAR(255),   -- ig-specific user id for Graph API
  additional_data JSONB,            -- any extra platform metadata
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
CREATE INDEX idx_connections_user ON platform_connections(user_id);
```

### Migration 8: content_posts
```sql
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Core content
  title VARCHAR(500),
  body TEXT,
  media_url TEXT,           -- publicly accessible URL to video/image
  media_type VARCHAR(20),   -- video, image, text

  -- Per-platform overrides (null = use body)
  youtube_title VARCHAR(500),
  youtube_description TEXT,
  youtube_tags VARCHAR(500),
  youtube_category_id VARCHAR(10) DEFAULT '22',
  youtube_privacy VARCHAR(20) DEFAULT 'public',
  instagram_caption TEXT,
  linkedin_text TEXT,
  twitter_text VARCHAR(280),

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, publishing, published, failed

  -- Scheduling
  scheduled_at TIMESTAMP,   -- null = post immediately when triggered

  -- Published results
  youtube_video_id VARCHAR(255),
  instagram_media_id VARCHAR(255),
  linkedin_post_id VARCHAR(255),
  twitter_tweet_id VARCHAR(255),

  publish_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_posts_user ON content_posts(user_id);
CREATE INDEX idx_posts_status ON content_posts(status);
CREATE INDEX idx_posts_scheduled ON content_posts(scheduled_at) WHERE status = 'scheduled';
```

### Migration 9: post_platforms (which platforms each post targets + per-platform status)
```sql
CREATE TABLE post_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,  -- youtube, instagram, linkedin, twitter
  status VARCHAR(20) DEFAULT 'pending', -- pending, publishing, published, failed
  platform_post_id VARCHAR(255),
  published_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, platform)
);
CREATE INDEX idx_post_platforms_post ON post_platforms(post_id);
CREATE INDEX idx_post_platforms_status ON post_platforms(status);
```

### Migration 10: ai_interactions (for logging Claude usage)
```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50), -- email_parse, deal_assist, rate_suggest, response_draft
  input_summary TEXT,
  output_text TEXT,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ai_user ON ai_interactions(user_id, created_at);
```

---

## 🔌 API ROUTES

### Auth Routes (`/api/auth`)
```
POST /api/auth/register        — create account
POST /api/auth/login           — returns JWT
GET  /api/auth/me              — get current user
PUT  /api/auth/me              — update profile
```

### Brands Routes (`/api/brands`)
```
GET    /api/brands             — list all brands for user
POST   /api/brands             — create brand
GET    /api/brands/:id         — get brand + deal history
PUT    /api/brands/:id         — update brand
DELETE /api/brands/:id         — delete brand
```

### Deals Routes (`/api/deals`)
```
GET    /api/deals              — list all deals (filter by stage, brand)
POST   /api/deals              — create deal
GET    /api/deals/:id          — get deal + deliverables + brand
PUT    /api/deals/:id          — update deal (including stage changes)
DELETE /api/deals/:id          — delete deal
PATCH  /api/deals/:id/stage    — move deal to new stage (also timestamps the move)
```

### Deliverables Routes (`/api/deals/:dealId/deliverables`)
```
GET    /api/deals/:dealId/deliverables          — list deliverables
POST   /api/deals/:dealId/deliverables          — add deliverable
PUT    /api/deals/:dealId/deliverables/:id      — update deliverable
DELETE /api/deals/:dealId/deliverables/:id      — delete deliverable
PATCH  /api/deals/:dealId/deliverables/:id/status  — update status
```

### Revenue Routes (`/api/revenue`)
```
GET  /api/revenue              — list entries (filter by date range, source_type)
POST /api/revenue              — add revenue entry
PUT  /api/revenue/:id          — update entry
DELETE /api/revenue/:id        — delete entry
GET  /api/revenue/summary      — aggregated totals by month, source, platform
GET  /api/revenue/forecast     — simple forecast based on last 3 months trend
```

### Invoice Routes (`/api/invoices`)
```
GET    /api/invoices           — list all invoices
POST   /api/invoices           — create invoice (usually from a deal)
GET    /api/invoices/:id       — get invoice
PUT    /api/invoices/:id       — update invoice
PATCH  /api/invoices/:id/status — mark as sent/paid/overdue
```

### Analytics Routes (`/api/analytics`)
```
GET /api/analytics/dashboard   — main dashboard stats
GET /api/analytics/pipeline    — pipeline value, win rate, avg deal size
GET /api/analytics/brands      — revenue per brand
GET /api/analytics/revenue     — revenue over time (monthly breakdown)
```

### Gmail Routes (`/api/gmail`)
```
GET  /api/gmail/auth           — OAuth URL to connect Gmail
GET  /api/gmail/callback       — OAuth callback handler
GET  /api/gmail/status         — is Gmail connected?
POST /api/gmail/scan           — scan inbox for sponsorship emails
GET  /api/gmail/emails         — list detected sponsorship emails
```

### Platform Connection Routes (`/api/connections`)
```
GET  /api/connections                    — list all connected platforms + status
GET  /api/connections/:platform/auth     — get OAuth URL for platform (youtube/instagram/linkedin/twitter)
GET  /api/connections/:platform/callback — OAuth callback
DELETE /api/connections/:platform        — disconnect platform
```

### Content Publishing Routes (`/api/posts`)
```
GET    /api/posts              — list all posts (filter: status, platform, date range)
POST   /api/posts              — create post (draft or schedule)
GET    /api/posts/:id          — get post + per-platform statuses
PUT    /api/posts/:id          — update post (only if still draft/scheduled)
DELETE /api/posts/:id          — delete post
PATCH  /api/posts/:id/schedule — set/update scheduled_at time
POST   /api/posts/:id/publish  — publish now (ignores scheduled_at, posts immediately)
GET    /api/posts/calendar     — posts grouped by date for calendar view (query: ?from=&to=)
```

### AI Routes (`/api/ai`)
```
POST /api/ai/parse-email       — paste email text, get structured deal data back
POST /api/ai/suggest-rate      — given brand + niche + follower count, suggest rate
POST /api/ai/draft-response    — given deal context, draft a reply email
POST /api/ai/repurpose         — basic content repurposing (input + target platform)
```

---

## 📡 PUBLISHING PLATFORM INTEGRATIONS

### OAuth Scopes Required

| Platform | Scopes |
|---|---|
| YouTube | `youtube.upload`, `youtube`, `youtube.readonly` |
| Instagram | `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_show_list` |
| LinkedIn | `w_member_social`, `r_liteprofile`, `r_emailaddress` |
| Twitter/X | `tweet.read`, `tweet.write`, `users.read`, `offline.access` |

---

### YouTube Service (`services/youtube.js`)

```javascript
const { google } = require('googleapis');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
}

function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    prompt: 'consent'
  });
}

async function uploadVideo(accessToken, refreshToken, { videoUrl, title, description, tags, categoryId, privacyStatus }) {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: client });

  // Fetch the video as a stream from videoUrl
  const axios = require('axios');
  const videoStream = (await axios({ url: videoUrl, method: 'GET', responseType: 'stream' })).data;

  const response = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        categoryId: categoryId || '22'
      },
      status: { privacyStatus: privacyStatus || 'public' }
    },
    media: { body: videoStream }
  });

  return response.data; // { id, snippet, status }
}

module.exports = { getAuthUrl, uploadVideo };
```

**Rate limit note:** Default quota is 10,000 units/day. Video upload costs 1,600 units (~6 uploads/day). For hackathon this is fine.

---

### Instagram Service (`services/instagram.js`)

Instagram requires a **Business or Creator account** linked to a **Facebook Page**. Personal accounts will not work.

```javascript
const BASE = 'https://graph.facebook.com/v19.0';

function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    scope: 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list',
    response_type: 'code'
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

async function exchangeCode(code) {
  const res = await fetch(`${BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code
    })
  });
  return res.json(); // { access_token, token_type }
}

async function getInstagramUserId(accessToken) {
  // Get linked IG business account ID
  const pagesRes = await fetch(`${BASE}/me/accounts?access_token=${accessToken}`);
  const pages = await pagesRes.json();
  const page = pages.data?.[0];
  if (!page) throw new Error('No Facebook page found');

  const igRes = await fetch(`${BASE}/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
  const igData = await igRes.json();
  return igData.instagram_business_account?.id;
}

async function postReel(accessToken, igUserId, { videoUrl, caption }) {
  // Step 1: Create container
  const containerRes = await fetch(`${BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,          // must be publicly accessible HTTPS URL
      caption,
      share_to_feed: true,
      access_token: accessToken
    })
  });
  const { id: containerId } = await containerRes.json();

  // Step 2: Poll until FINISHED (max 5 min)
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status !== 'FINISHED' && attempts < 60) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${BASE}/${containerId}?fields=status_code&access_token=${accessToken}`);
    const statusData = await statusRes.json();
    status = statusData.status_code;
    attempts++;
    if (status === 'ERROR') throw new Error('Instagram upload failed');
  }

  // Step 3: Publish
  const publishRes = await fetch(`${BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken })
  });
  return publishRes.json(); // { id: media_id }
}

async function postPhoto(accessToken, igUserId, { imageUrl, caption }) {
  const containerRes = await fetch(`${BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken })
  });
  const { id: containerId } = await containerRes.json();

  const publishRes = await fetch(`${BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken })
  });
  return publishRes.json();
}

module.exports = { getAuthUrl, exchangeCode, getInstagramUserId, postReel, postPhoto };
```

**Key constraint:** Video/image must be at a publicly accessible HTTPS URL. You'll need to either accept a URL input from the user or upload to a temp bucket first. For the hackathon, accepting a direct URL input is fine.

---

### LinkedIn Service (`services/linkedin.js`)

```javascript
function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: 'w_member_social r_liteprofile r_emailaddress',
    state: 'creatoros_linkedin'
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

async function exchangeCode(code) {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI
    })
  });
  return res.json(); // { access_token, expires_in }
}

async function getProfile(accessToken) {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.json(); // { sub (person URN), name, email }
}

async function createPost(accessToken, personUrn, text) {
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${personUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  });
  const data = await res.json();
  return { id: data.id }; // LinkedIn post URN
}

module.exports = { getAuthUrl, exchangeCode, getProfile, createPost };
```

---

### Twitter/X Service (`services/twitter.js`)

Twitter uses OAuth 2.0 PKCE for user auth. Use the `twitter-api-v2` npm package — it handles the PKCE flow and token refresh cleanly.

```javascript
const { TwitterApi } = require('twitter-api-v2');

function getClient() {
  return new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET
  });
}

async function getAuthUrl() {
  const client = getClient();
  const { url, codeVerifier, state } = await client.generateOAuth2AuthLink(
    process.env.TWITTER_REDIRECT_URI,
    { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
  );
  return { url, codeVerifier, state }; // store codeVerifier in session/temp DB
}

async function exchangeCode(code, codeVerifier) {
  const client = getClient();
  const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: process.env.TWITTER_REDIRECT_URI
  });
  return { accessToken, refreshToken, expiresIn };
}

async function postTweet(accessToken, text) {
  const userClient = new TwitterApi(accessToken);
  const tweet = await userClient.v2.tweet(text);
  return { id: tweet.data.id };
}

async function postThread(accessToken, tweets) {
  // tweets = array of strings, each under 280 chars
  const userClient = new TwitterApi(accessToken);
  let replyToId = null;
  const posted = [];

  for (const text of tweets) {
    const params = replyToId ? { reply: { in_reply_to_tweet_id: replyToId }, text } : { text };
    const tweet = await userClient.v2.tweet(params);
    replyToId = tweet.data.id;
    posted.push(tweet.data.id);
  }

  return { ids: posted };
}

module.exports = { getAuthUrl, exchangeCode, postTweet, postThread };
```

---

### Publish Scheduler (`jobs/publishScheduler.js`)

Runs every minute via `node-cron`, picks up scheduled posts whose `scheduled_at` has passed.

```javascript
const cron = require('node-cron');
const { ContentPost, PostPlatform, PlatformConnection } = require('../models');
const youtube = require('../services/youtube');
const instagram = require('../services/instagram');
const linkedin = require('../services/linkedin');
const twitter = require('../services/twitter');
const { Op } = require('sequelize');

async function publishPost(post) {
  const targets = await PostPlatform.findAll({ where: { post_id: post.id, status: 'pending' } });
  const connections = await PlatformConnection.findAll({ where: { user_id: post.user_id, is_active: true } });
  const connMap = Object.fromEntries(connections.map(c => [c.platform, c]));

  for (const target of targets) {
    const conn = connMap[target.platform];
    if (!conn) {
      await target.update({ status: 'failed', error_message: 'Platform not connected' });
      continue;
    }

    try {
      await target.update({ status: 'publishing' });
      let result;

      if (target.platform === 'youtube') {
        result = await youtube.uploadVideo(conn.access_token, conn.refresh_token, {
          videoUrl: post.media_url,
          title: post.youtube_title || post.title,
          description: post.youtube_description || post.body,
          tags: post.youtube_tags,
          categoryId: post.youtube_category_id,
          privacyStatus: post.youtube_privacy
        });
        await post.update({ youtube_video_id: result.id });
      }

      else if (target.platform === 'instagram') {
        const caption = post.instagram_caption || post.body;
        const igUserId = conn.instagram_user_id;
        result = post.media_type === 'video'
          ? await instagram.postReel(conn.access_token, igUserId, { videoUrl: post.media_url, caption })
          : await instagram.postPhoto(conn.access_token, igUserId, { imageUrl: post.media_url, caption });
        await post.update({ instagram_media_id: result.id });
      }

      else if (target.platform === 'linkedin') {
        result = await linkedin.createPost(conn.access_token, conn.platform_user_id, post.linkedin_text || post.body);
        await post.update({ linkedin_post_id: result.id });
      }

      else if (target.platform === 'twitter') {
        const text = post.twitter_text || post.body;
        result = await twitter.postTweet(conn.access_token, text);
        await post.update({ twitter_tweet_id: result.id });
      }

      await target.update({ status: 'published', platform_post_id: result?.id, published_at: new Date() });

    } catch (err) {
      await target.update({ status: 'failed', error_message: err.message });
    }
  }

  // Check if all platforms done
  const remaining = await PostPlatform.count({ where: { post_id: post.id, status: ['pending', 'publishing'] } });
  const failed = await PostPlatform.count({ where: { post_id: post.id, status: 'failed' } });

  if (remaining === 0) {
    await post.update({ status: failed > 0 ? 'failed' : 'published' });
  }
}

function startScheduler() {
  cron.schedule('* * * * *', async () => {
    const duePosts = await ContentPost.findAll({
      where: {
        status: 'scheduled',
        scheduled_at: { [Op.lte]: new Date() }
      }
    });

    for (const post of duePosts) {
      await post.update({ status: 'publishing' });
      publishPost(post).catch(console.error); // fire and forget per post
    }
  });

  console.log('Publish scheduler started');
}

module.exports = { startScheduler };
```

Call `startScheduler()` in `src/index.js` on server boot.

---

This is the core differentiator. Build these 4 AI endpoints well.

### Service: `backend/src/services/claude.js`

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 1. Parse sponsorship email → structured deal data
async function parseEmailForDeal(emailText) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a sponsorship deal parser for content creators. Extract structured deal information from this email.

Return ONLY valid JSON in this exact format:
{
  "is_sponsorship": boolean,
  "confidence": number (0-1),
  "brand_name": string or null,
  "contact_name": string or null,
  "contact_email": string or null,
  "budget_amount": number or null,
  "currency": string or null,
  "deliverables": [
    { "type": string, "platform": string, "quantity": number, "details": string }
  ],
  "timeline_notes": string or null,
  "requirements": string or null,
  "key_dates": string or null,
  "sentiment": "positive" | "neutral" | "negative",
  "summary": string (2-3 sentence plain English summary)
}

Email:
${emailText}`
    }]
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { is_sponsorship: false, confidence: 0, error: 'parse_failed' };
  }
}

// 2. Suggest rate for a deal
async function suggestRate(context) {
  // context: { niche, platform, followerCount, engagementRate, deliverables, brandBudgetHistory }
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a sponsorship rate advisor for content creators. Based on the creator's profile, suggest a fair rate range.

Creator context:
- Niche: ${context.niche || 'general'}
- Platform: ${context.platform || 'unknown'}
- Follower count: ${context.followerCount || 'unknown'}
- Engagement rate: ${context.engagementRate || 'unknown'}
- Deliverables requested: ${JSON.stringify(context.deliverables)}
- Past deals with this brand: ${JSON.stringify(context.brandBudgetHistory || [])}

Return ONLY valid JSON:
{
  "low_estimate": number,
  "mid_estimate": number,
  "high_estimate": number,
  "currency": "USD",
  "reasoning": string (2-3 sentences explaining the estimate),
  "negotiation_tips": [string, string]
}`
    }]
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { error: 'parse_failed', raw: text };
  }
}

// 3. Draft a response email
async function draftResponse(context) {
  // context: { dealTitle, brandName, stage, userAction, originalEmailSnippet, creatorName }
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a professional email writer for a content creator. Draft a reply email.

Context:
- Creator name: ${context.creatorName}
- Brand: ${context.brandName}
- Deal: ${context.dealTitle}
- Current stage: ${context.stage}
- Creator wants to: ${context.userAction}
- Original email snippet: ${context.originalEmailSnippet || 'N/A'}

Write a professional, friendly email reply. Keep it concise (under 200 words). Do not include a subject line. Start directly with the greeting.`
    }]
  });

  return { draft: response.content[0].text };
}

// 4. Basic content repurposing
async function repurposeContent(context) {
  // context: { sourceContent, sourcePlatform, targetPlatform, contentType }
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are a content repurposing expert for creators. Adapt this content for a different platform.

Source platform: ${context.sourcePlatform}
Target platform: ${context.targetPlatform}
Content type: ${context.contentType}

Original content:
${context.sourceContent}

Rewrite this content optimized for ${context.targetPlatform}. Include appropriate formatting, hashtags, and tone for that platform. Be practical and specific.`
    }]
  });

  return { repurposed: response.content[0].text };
}

module.exports = { parseEmailForDeal, suggestRate, draftResponse, repurposeContent };
```

---

## 📊 ANALYTICS LOGIC

### Dashboard endpoint (`GET /api/analytics/dashboard`)
Return this shape:
```json
{
  "revenue": {
    "this_month": 0,
    "last_month": 0,
    "this_year": 0,
    "mom_growth_percent": 0
  },
  "pipeline": {
    "total_active_value": 0,
    "deals_count": 0,
    "by_stage": { "inbound": 0, "negotiation": 0, "in_production": 0 }
  },
  "invoices": {
    "outstanding_count": 0,
    "outstanding_value": 0,
    "overdue_count": 0
  },
  "top_brands": [
    { "name": "BrandX", "total_revenue": 0, "deal_count": 0 }
  ]
}
```

### Revenue summary (`GET /api/revenue/summary`)
Query params: `?from=YYYY-MM-DD&to=YYYY-MM-DD`
Return:
```json
{
  "total": 0,
  "by_month": [{ "month": "2025-01", "amount": 0 }],
  "by_source": [{ "source_type": "sponsorship", "amount": 0 }],
  "by_platform": [{ "platform": "youtube", "amount": 0 }],
  "by_brand": [{ "brand_name": "BrandX", "amount": 0 }]
}
```

---

## 🔐 AUTH

Use JWT. Keep it simple:
- `bcryptjs` for password hashing
- `jsonwebtoken` for JWT (7d expiry)
- `authMiddleware` checks `Authorization: Bearer <token>` header on all protected routes
- Store userId in `req.user.id`

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 📧 GMAIL INTEGRATION

Scope needed: `https://www.googleapis.com/auth/gmail.readonly`

OAuth flow:
1. `GET /api/gmail/auth` → redirect user to Google OAuth
2. Google redirects to `GET /api/gmail/callback?code=xxx`
3. Exchange code for tokens → store in `platform_connections`
4. `POST /api/gmail/scan` → fetch last 50 emails, filter likely sponsorships, run `parseEmailForDeal()` on each

```javascript
// services/gmail.js
const { google } = require('googleapis');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent'
  });
}

async function getEmails(accessToken, maxResults = 50) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const list = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'subject:(sponsor OR partnership OR collab OR collaboration OR deal OR sponsorship)'
  });

  const messages = list.data.messages || [];
  const emails = [];

  for (const msg of messages.slice(0, 20)) { // limit to 20 to avoid quota issues
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full'
    });

    const headers = full.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const body = extractBody(full.data.payload);

    emails.push({ id: msg.id, threadId: full.data.threadId, subject, from, body });
  }

  return emails;
}

function extractBody(payload) {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  }
  return '';
}

module.exports = { getAuthUrl, getEmails };
```

---

## 🖥️ FRONTEND (Minimal, Functional)

### Stack
- React + Vite
- Tailwind CSS (utility classes only, no component libs)
- React Query (data fetching)
- React Router (routing)
- Recharts (charts)

### Design Rules — Read These Carefully
- **No purple.** No gradient hero sections. No glassmorphism.
- Color palette: white backgrounds, `gray-900` text, `blue-600` for primary actions, `green-600` for revenue/success, `amber-500` for warnings, `red-500` for overdue
- Font: system font stack (`font-sans`)
- Deal cards: white, subtle `border border-gray-200`, `rounded-lg`, `shadow-sm` — nothing more
- Sidebar nav: `bg-white border-r border-gray-200`, not dark
- Tables > cards for lists of data
- No animations except React Query loading states

### Pages to Build (in priority order)

**1. `/dashboard`**
- Revenue this month (big number)
- Pipeline value (big number)
- Outstanding invoices (big number, red if any overdue)
- Revenue by month bar chart (Recharts)
- Recent deals table (last 5)

**2. `/pipeline`**
- Kanban board: columns = deal stages
- Deal card shows: brand name, deal value, posting deadline, stage badge
- Click card → opens deal detail
- "New Deal" button top right
- Filter by brand dropdown

**3. `/deals/:id`**
- Deal header: brand, value, stage selector dropdown
- Deliverables list with status toggles
- AI assistant panel on the right:
  - "Parse Email" — paste email, get deal data back
  - "Suggest Rate" — one click, shows rate range
  - "Draft Response" — select intent, get email draft

**4. `/brands`**
- Table: brand name, total deals, total revenue, warmth score badge, last deal date
- Click → brand detail with deal history

**5. `/revenue`**
- Add revenue entry form
- Revenue table with filters
- Summary cards: by source type, by platform
- Monthly bar chart

---

## ⚙️ ENVIRONMENT VARIABLES

```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/creatoros

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this

# Claude AI (REQUIRED)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Gmail OAuth (for email scanning feature)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback
```

---

## 📦 PACKAGE LIST

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "sequelize": "^6.33.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@anthropic-ai/sdk": "^0.24.0",
    "googleapis": "^140.0.0",
    "express-validator": "^7.0.1",
    "morgan": "^1.10.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "react-beautiful-dnd": "^13.1.1",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🚀 STARTUP SEQUENCE

```bash
# 1. Start PostgreSQL
# 2. Create database
createdb creatoros

# 3. Run migrations (in order)
cd backend && npm run migrate

# 4. Seed demo data (optional but useful for hackathon demo)
npm run seed

# 5. Start backend
npm run dev  # nodemon src/index.js on port 3000

# 6. Start frontend
cd frontend && npm run dev  # Vite on port 5173
```

---

## 🌱 SEED DATA (for demo)

Create a seed script that inserts:
- 1 demo user (`demo@creatoros.com` / `demo1234`)
- 5 brands (Nike, Squarespace, NordVPN, Skillshare, Notion)
- 8 deals spread across different pipeline stages with realistic values ($2K–$15K)
- 12 revenue entries over last 6 months
- 3 unpaid invoices (1 overdue)
- Deliverables for each active deal

This makes the demo look alive immediately without needing real OAuth setup.

---

## ✅ HACKATHON BUILD CHECKLIST

### Day 1 — Backend
- [ ] Express app setup + middleware + error handler
- [ ] All migrations run
- [ ] Auth routes (register, login, me)
- [ ] Brands CRUD
- [ ] Deals CRUD + stage update
- [ ] Deliverables CRUD
- [ ] Revenue CRUD + summary endpoint
- [ ] Invoice CRUD
- [ ] Analytics dashboard endpoint
- [ ] Claude service (all 4 functions)
- [ ] AI routes wired up
- [ ] Gmail OAuth flow (at least the URL generation + callback)
- [ ] Seed data script

### Day 2 — Frontend + Polish
- [ ] Auth (login page + JWT storage)
- [ ] Dashboard page with charts
- [ ] Pipeline Kanban board
- [ ] Deal detail page with AI panel
- [ ] Revenue page
- [ ] Brands table
- [ ] Connect everything to backend API
- [ ] Test the full deal lifecycle flow end to end
- [ ] Make sure seed data demo works cleanly

---

## ⚠️ WHAT TO SKIP — DO NOT BUILD THESE

These are explicitly out of scope for the hackathon. Do not implement:

- YouTube / Instagram / TikTok publishing
- Content calendar / scheduling
- Team management / roles / permissions
- File storage / asset management
- Contract e-signature (just template text is fine)
- WhatsApp / Slack / Discord integration
- Thumbnail design tools
- Benchmarking / competitor analysis
- Stripe / actual payment processing
- Redis caching
- Sentry monitoring
- Docker setup
- Multi-currency conversion
- Notification system

If asked to implement any of the above, respond: "Out of scope for MVP. Skipping."

---

**End of CLAUDE.md**
