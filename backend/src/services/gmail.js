const { google } = require('googleapis');

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

/**
 * Returns the Gmail OAuth authorization URL.
 * @param {string} [userId] - Optional user ID encoded into state parameter.
 */
function getAuthUrl(userId) {
  const oauth2Client = createOAuthClient();
  const state = userId ? Buffer.from(userId).toString('base64') : undefined;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
    ...(state && { state }),
  });
}

/**
 * Exchange an authorization code for tokens.
 */
async function exchangeCode(code) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Extract plain text body from a Gmail message payload.
 */
function extractBody(payload) {
  if (!payload) return '';

  // Direct body data
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  // Multipart — prefer text/plain
  if (payload.parts && payload.parts.length > 0) {
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart && textPart.body && textPart.body.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }

    // Recurse into nested parts
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return '';
}

/**
 * Fetch recent emails from Gmail inbox that look like brand sponsorship outreach.
 */
async function getEmails(accessToken, refreshToken, maxResults = 20) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Search for sponsorship-related emails
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'sponsorship OR collaboration OR partnership OR "brand deal" OR "paid partnership"',
  });

  const messages = listRes.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const headers = msgRes.data.payload.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || '(no subject)';
        const from = headers.find((h) => h.name === 'From')?.value || '';
        const date = headers.find((h) => h.name === 'Date')?.value || '';
        const body = extractBody(msgRes.data.payload);

        return {
          id: msg.id,
          thread_id: msg.threadId,
          subject,
          from,
          date,
          body: body.slice(0, 3000), // trim to avoid excessive token usage
          snippet: msgRes.data.snippet || '',
        };
      } catch {
        return null;
      }
    })
  );

  return emails.filter(Boolean);
}

module.exports = { getAuthUrl, exchangeCode, extractBody, getEmails };
