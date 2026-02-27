const router = require('express').Router();
const claude = require('../services/claude');

// POST /parse-email
router.post('/parse-email', async (req, res, next) => {
  try {
    const { emailText } = req.body;
    if (!emailText) return res.status(400).json({ error: 'emailText is required' });

    const result = await claude.parseEmailForDeal(emailText);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /suggest-rate
router.post('/suggest-rate', async (req, res, next) => {
  try {
    const { niche, platform, followerCount, engagementRate, deliverables, brandBudgetHistory } =
      req.body;

    const result = await claude.suggestRate({
      niche,
      platform,
      followerCount,
      engagementRate,
      deliverables,
      brandBudgetHistory,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /draft-response
router.post('/draft-response', async (req, res, next) => {
  try {
    const { dealTitle, brandName, stage, userAction, originalEmailSnippet, creatorName } = req.body;

    const result = await claude.draftResponse({
      dealTitle,
      brandName,
      stage,
      userAction,
      originalEmailSnippet,
      creatorName,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /repurpose
router.post('/repurpose', async (req, res, next) => {
  try {
    const { sourceContent, sourcePlatform, targetPlatform, contentType } = req.body;

    const result = await claude.repurposeContent({
      sourceContent,
      sourcePlatform,
      targetPlatform,
      contentType,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
