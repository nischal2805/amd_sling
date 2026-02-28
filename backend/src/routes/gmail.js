const express = require('express');
const { PlatformConnection } = require('../models');
const gmailService = require('../services/gmail');
const claude = require('../services/claude');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/gmail/auth — redirect to Google OAuth
router.get('/auth', auth, (req, res) => {
  const url = gmailService.getAuthUrl();
  res.json({ url });
});

// GET /api/gmail/callback
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('No code provided');

    // Note: In production, verify state param to prevent CSRF
    const tokens = await gmailService.exchangeCode(code);

    // We need user ID from state param — for simplicity encode userId in state
    const userId = state;
    if (!userId) return res.status(400).send('No user state');

    await PlatformConnection.upsert({
      user_id: userId,
      platform: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      is_active: true
    });

    res.redirect(`${process.env.FRONTEND_URL}/connections?connected=gmail`);
  } catch (err) {
    next(err);
  }
});

// GET /api/gmail/auth-url — returns URL with userId in state (frontend uses this)
router.get('/connect', auth, (req, res) => {
  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
    state: req.user.id
  });
  res.json({ url });
});

// GET /api/gmail/status
router.get('/status', auth, async (req, res, next) => {
  try {
    const conn = await PlatformConnection.findOne({
      where: { user_id: req.user.id, platform: 'gmail', is_active: true }
    });
    res.json({ connected: !!conn, last_synced: conn?.last_synced_at });
  } catch (err) {
    next(err);
  }
});

// POST /api/gmail/scan
router.post('/scan', auth, async (req, res, next) => {
  try {
    const conn = await PlatformConnection.findOne({
      where: { user_id: req.user.id, platform: 'gmail', is_active: true }
    });
    if (!conn) return res.status(400).json({ error: 'Gmail not connected' });

    const emails = await gmailService.getEmails(conn.access_token);
    const results = [];

    for (const email of emails) {
      const parsed = await claude.parseEmailForDeal(`Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body}`);
      if (parsed.is_sponsorship && parsed.confidence > 0.5) {
        results.push({ email, parsed });
      }
    }

    await conn.update({ last_synced_at: new Date() });
    res.json({ scanned: emails.length, sponsorships_found: results.length, results });
  } catch (err) {
    next(err);
  }
});

// GET /api/gmail/emails (list last scan results - simplified)
router.get('/emails', auth, async (req, res, next) => {
  try {
    const conn = await PlatformConnection.findOne({
      where: { user_id: req.user.id, platform: 'gmail', is_active: true }
    });
    if (!conn) return res.status(400).json({ error: 'Gmail not connected' });

    const emails = await gmailService.getEmails(conn.access_token, 20);
    res.json(emails);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
