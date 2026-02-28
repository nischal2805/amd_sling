const express = require('express');
const { AiInteraction } = require('../models');
const claude = require('../services/claude');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/ai/parse-email
router.post('/parse-email', auth, async (req, res, next) => {
  try {
    const { email_text, deal_id } = req.body;
    if (!email_text) return res.status(400).json({ error: 'email_text required' });

    const result = await claude.parseEmailForDeal(email_text);

    await AiInteraction.create({
      user_id: req.user.id,
      type: 'email_parse',
      input_summary: email_text.slice(0, 200),
      output_text: JSON.stringify(result),
      deal_id: deal_id || null
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/suggest-rate
router.post('/suggest-rate', auth, async (req, res, next) => {
  try {
    const { niche, platform, follower_count, engagement_rate, deliverables, brand_budget_history, deal_id } = req.body;

    const result = await claude.suggestRate({
      niche, platform,
      followerCount: follower_count,
      engagementRate: engagement_rate,
      deliverables: deliverables || [],
      brandBudgetHistory: brand_budget_history || []
    });

    await AiInteraction.create({
      user_id: req.user.id,
      type: 'rate_suggest',
      input_summary: JSON.stringify({ niche, platform, follower_count }),
      output_text: JSON.stringify(result),
      deal_id: deal_id || null
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/draft-response
router.post('/draft-response', auth, async (req, res, next) => {
  try {
    const { deal_title, brand_name, stage, user_action, original_email_snippet, creator_name, deal_id } = req.body;

    const result = await claude.draftResponse({
      dealTitle: deal_title,
      brandName: brand_name,
      stage,
      userAction: user_action,
      originalEmailSnippet: original_email_snippet,
      creatorName: creator_name || req.user.full_name || 'Creator'
    });

    await AiInteraction.create({
      user_id: req.user.id,
      type: 'response_draft',
      input_summary: `${brand_name} - ${user_action}`,
      output_text: result.draft,
      deal_id: deal_id || null
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/repurpose
router.post('/repurpose', auth, async (req, res, next) => {
  try {
    const { source_content, source_platform, target_platform, content_type } = req.body;
    if (!source_content || !target_platform) return res.status(400).json({ error: 'source_content and target_platform required' });

    const result = await claude.repurposeContent({
      sourceContent: source_content,
      sourcePlatform: source_platform || 'unknown',
      targetPlatform: target_platform,
      contentType: content_type || 'text'
    });

    await AiInteraction.create({
      user_id: req.user.id,
      type: 'deal_assist',
      input_summary: `Repurpose from ${source_platform} to ${target_platform}`,
      output_text: result.repurposed
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
