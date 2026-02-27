const router = require('express').Router();
const jwt = require('jsonwebtoken');
const gmailService = require('../services/gmail');
const claude = require('../services/claude');
const { PlatformConnection } = require('../models');

// Helper: get user from token (optional auth for gmail routes)
function getUserId(req) {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
}

// GET /auth — return OAuth URL
router.get('/auth', (req, res) => {
  const url = gmailService.getAuthUrl();
  res.json({ data: { url } });
});

// GET /callback — exchange code for tokens, store connection
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing authorization code' });

    // state encodes the user id (set when generating auth URL)
    const userId = state ? Buffer.from(state, 'base64').toString() : null;

    const tokens = await gmailService.exchangeCode(code);

    if (userId) {
      // Upsert platform connection
      const existing = await PlatformConnection.findOne({
        where: { user_id: userId, platform: 'gmail' },
      });

      if (existing) {
        await existing.update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existing.refresh_token,
          is_active: true,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        });
      } else {
        await PlatformConnection.create({
          user_id: userId,
          platform: 'gmail',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          is_active: true,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        });
      }
    }

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/settings?gmail=connected`);
  } catch (err) {
    next(err);
  }
});

// GET /status — check if gmail is connected
router.get('/status', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await PlatformConnection.findOne({
      where: { user_id: userId, platform: 'gmail', is_active: true },
    });
    res.json({ data: { connected: !!conn } });
  } catch (err) {
    next(err);
  }
});

// POST /scan — scan inbox and parse emails for deals
router.post('/scan', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await PlatformConnection.findOne({
      where: { user_id: userId, platform: 'gmail', is_active: true },
    });
    if (!conn) return res.status(400).json({ error: 'Gmail not connected' });

    const emails = await gmailService.getEmails(conn.access_token, conn.refresh_token);

    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          const parsed = await claude.parseEmailForDeal(email.body);
          return { ...email, parsed };
        } catch {
          return { ...email, parsed: null };
        }
      })
    );

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// GET /emails — list emails from last scan (alias of scan with GET)
router.get('/emails', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await PlatformConnection.findOne({
      where: { user_id: userId, platform: 'gmail', is_active: true },
    });
    if (!conn) return res.status(400).json({ error: 'Gmail not connected' });

    const emails = await gmailService.getEmails(conn.access_token, conn.refresh_token);
    res.json({ data: emails });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
