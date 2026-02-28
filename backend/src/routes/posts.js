const express = require('express');
const { ContentPost, PostPlatform, Deal } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/posts/calendar — must be before /:id
router.get('/calendar', auth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = { user_id: req.user.id };
    if (from || to) {
      where.scheduled_at = {};
      if (from) where.scheduled_at[Op.gte] = from;
      if (to) where.scheduled_at[Op.lte] = to;
    }

    const posts = await ContentPost.findAll({
      where,
      include: [{ model: PostPlatform, as: 'platforms' }],
      order: [['scheduled_at', 'ASC']]
    });

    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts
router.get('/', auth, async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.from || req.query.to) {
      where.scheduled_at = {};
      if (req.query.from) where.scheduled_at[Op.gte] = req.query.from;
      if (req.query.to) where.scheduled_at[Op.lte] = req.query.to;
    }

    const posts = await ContentPost.findAll({
      where,
      include: [{ model: PostPlatform, as: 'platforms' }],
      order: [['created_at', 'DESC']]
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      title, body, media_url, media_type, deal_id,
      youtube_title, youtube_description, youtube_tags, youtube_category_id, youtube_privacy,
      instagram_caption, linkedin_text, twitter_text,
      scheduled_at, platforms
    } = req.body;

    const post = await ContentPost.create({
      user_id: req.user.id,
      title, body, media_url, media_type, deal_id,
      youtube_title, youtube_description, youtube_tags, youtube_category_id, youtube_privacy,
      instagram_caption, linkedin_text, twitter_text,
      status: scheduled_at ? 'scheduled' : 'draft',
      scheduled_at
    });

    // Create PostPlatform entries
    if (platforms && Array.isArray(platforms)) {
      for (const platform of platforms) {
        await PostPlatform.create({ post_id: post.id, platform, status: 'pending' });
      }
    }

    const fullPost = await ContentPost.findByPk(post.id, { include: [{ model: PostPlatform, as: 'platforms' }] });
    res.status(201).json(fullPost);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const post = await ContentPost.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: PostPlatform, as: 'platforms' }]
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const post = await ContentPost.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!['draft', 'scheduled'].includes(post.status)) {
      return res.status(400).json({ error: 'Can only edit draft or scheduled posts' });
    }

    const fields = ['title', 'body', 'media_url', 'media_type', 'youtube_title', 'youtube_description', 'youtube_tags', 'youtube_category_id', 'youtube_privacy', 'instagram_caption', 'linkedin_text', 'twitter_text', 'scheduled_at', 'deal_id'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await post.update(updates);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await ContentPost.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await post.destroy();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/posts/:id/schedule
router.patch('/:id/schedule', auth, async (req, res, next) => {
  try {
    const { scheduled_at } = req.body;
    const post = await ContentPost.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await post.update({ scheduled_at, status: scheduled_at ? 'scheduled' : 'draft' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/publish — publish now
router.post('/:id/publish', auth, async (req, res, next) => {
  try {
    const post = await ContentPost.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { publishPost } = require('../jobs/publishScheduler');
    await post.update({ status: 'publishing', scheduled_at: new Date() });
    publishPost(post).catch(console.error);

    res.json({ message: 'Publishing started', post_id: post.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
