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
      } else if (target.platform === 'instagram') {
        const caption = post.instagram_caption || post.body;
        const igUserId = conn.instagram_user_id;
        result = post.media_type === 'video'
          ? await instagram.postReel(conn.access_token, igUserId, { videoUrl: post.media_url, caption })
          : await instagram.postPhoto(conn.access_token, igUserId, { imageUrl: post.media_url, caption });
        await post.update({ instagram_media_id: result.id });
      } else if (target.platform === 'linkedin') {
        result = await linkedin.createPost(conn.access_token, conn.platform_user_id, post.linkedin_text || post.body);
        await post.update({ linkedin_post_id: result.id });
      } else if (target.platform === 'twitter') {
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
  const remaining = await PostPlatform.count({ where: { post_id: post.id, status: { [Op.in]: ['pending', 'publishing'] } } });
  const failed = await PostPlatform.count({ where: { post_id: post.id, status: 'failed' } });

  if (remaining === 0) {
    await post.update({ status: failed > 0 ? 'failed' : 'published' });
  }
}

function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      const duePosts = await ContentPost.findAll({
        where: {
          status: 'scheduled',
          scheduled_at: { [Op.lte]: new Date() }
        }
      });

      for (const post of duePosts) {
        await post.update({ status: 'publishing' });
        publishPost(post).catch(console.error);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });

  console.log('Publish scheduler started');
}

module.exports = { startScheduler, publishPost };
