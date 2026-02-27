const router = require('express').Router();
const { Deliverable, Deal } = require('../models');

// Verify the deal belongs to the authenticated user
async function ownsDeal(dealId, userId) {
  const deal = await Deal.findOne({ where: { id: dealId, user_id: userId } });
  return deal;
}

// GET /deal/:dealId — list deliverables for a deal
router.get('/deal/:dealId', async (req, res, next) => {
  try {
    const deal = await ownsDeal(req.params.dealId, req.user.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const deliverables = await Deliverable.findAll({
      where: { deal_id: req.params.dealId },
      order: [['created_at', 'ASC']],
    });
    res.json({ data: deliverables });
  } catch (err) {
    next(err);
  }
});

// POST / — create deliverable
router.post('/', async (req, res, next) => {
  try {
    const { deal_id, type, platform, quantity, details, status } = req.body;
    if (!deal_id || !type || !platform) {
      return res.status(400).json({ error: 'deal_id, type, and platform are required' });
    }

    const deal = await ownsDeal(deal_id, req.user.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const deliverable = await Deliverable.create({ deal_id, type, platform, quantity, details, status });
    res.status(201).json({ data: deliverable });
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update deliverable
router.put('/:id', async (req, res, next) => {
  try {
    const deliverable = await Deliverable.findByPk(req.params.id, { include: [Deal] });
    if (!deliverable || deliverable.Deal.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const { type, platform, quantity, details, status } = req.body;
    await deliverable.update({ type, platform, quantity, details, status });
    res.json({ data: deliverable });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/status — update status only
router.patch('/:id/status', async (req, res, next) => {
  try {
    const deliverable = await Deliverable.findByPk(req.params.id, { include: [Deal] });
    if (!deliverable || deliverable.Deal.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    await deliverable.update({ status });
    res.json({ data: deliverable });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete deliverable
router.delete('/:id', async (req, res, next) => {
  try {
    const deliverable = await Deliverable.findByPk(req.params.id, { include: [Deal] });
    if (!deliverable || deliverable.Deal.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    await deliverable.destroy();
    res.json({ data: { message: 'Deliverable deleted' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
