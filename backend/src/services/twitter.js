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
  return { url, codeVerifier, state };
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
