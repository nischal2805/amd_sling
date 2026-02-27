const router = require('express').Router();
const { Deal, Brand, Deliverable } = require('../models');

// GET / — list all deals (with optional ?stage= filter)
router.get('/', async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.stage) where.stage = req.query.stage;

    const deals = await Deal.findAll({
      where,
      include: [
        { model: Brand, attributes: ['id', 'name'] },
        { model: Deliverable },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ data: deals });
  } catch (err) {
    next(err);
  }
});

// POST / — create deal
router.post('/', async (req, res, next) => {
  try {
    const { brand_id, title, stage, value, currency, posting_deadline, contract_url, notes } =
      req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const deal = await Deal.create({
      user_id: req.user.id,
      brand_id,
      title,
      stage,
      value,
      currency,
      posting_deadline,
      contract_url,
      notes,
    });
    res.status(201).json({ data: deal });
  } catch (err) {
    next(err);
  }
});

// GET /:id — get deal with brand and deliverables
router.get('/:id', async (req, res, next) => {
  try {
    const deal = await Deal.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Brand }, { model: Deliverable }],
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json({ data: deal });
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update deal
router.put('/:id', async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const { brand_id, title, stage, value, currency, posting_deadline, contract_url, notes } =
      req.body;
    await deal.update({ brand_id, title, stage, value, currency, posting_deadline, contract_url, notes });
    res.json({ data: deal });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete deal
router.delete('/:id', async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    await deal.destroy();
    res.json({ data: { message: 'Deal deleted' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/stage — update stage only
router.patch('/:id/stage', async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'stage is required' });

    await deal.update({ stage });
    res.json({ data: deal });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
