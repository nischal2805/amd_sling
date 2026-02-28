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
  return res.json();
}

async function getInstagramUserId(accessToken) {
  const pagesRes = await fetch(`${BASE}/me/accounts?access_token=${accessToken}`);
  const pages = await pagesRes.json();
  const page = pages.data?.[0];
  if (!page) throw new Error('No Facebook page found');

  const igRes = await fetch(`${BASE}/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
  const igData = await igRes.json();
  return igData.instagram_business_account?.id;
}

async function postReel(accessToken, igUserId, { videoUrl, caption }) {
  const containerRes = await fetch(`${BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      share_to_feed: true,
      access_token: accessToken
    })
  });
  const { id: containerId } = await containerRes.json();

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

  const publishRes = await fetch(`${BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken })
  });
  return publishRes.json();
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
