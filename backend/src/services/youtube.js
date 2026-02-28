const { google } = require('googleapis');
const axios = require('axios');

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

  return response.data;
}

module.exports = { getAuthUrl, uploadVideo };
