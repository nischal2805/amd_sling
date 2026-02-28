const express = require('express');
const { Deal, Brand, Deliverable, Invoice } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

const STAGE_TIMESTAMPS = {
  contract_sent: 'contract_sent_at',
  contract_signed: 'contract_signed_at',
  invoice_sent: 'invoice_sent_at',
  paid: 'payment_received_at'
};

// GET /api/deals
router.get('/', auth, async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.stage) where.stage = req.query.stage;
    if (req.query.brand_id) where.brand_id = req.query.brand_id;

    const deals = await Deal.findAll({
      where,
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name', 'industry'] }],
      order: [['updated_at', 'DESC']]
    });
    res.json(deals);
  } catch (err) {
    next(err);
  }
});

// POST /api/deals
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, brand_id, brand_name, total_value, currency, stage, description, posting_deadline, start_date, end_date, email_thread_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Deal title required' });

    // If brand_name is provided, find or create the brand
    let resolvedBrandId = brand_id || null;
    if (!resolvedBrandId && brand_name && brand_name.trim()) {
      const [brand] = await Brand.findOrCreate({
        where: { name: brand_name.trim(), user_id: req.user.id },
        defaults: { name: brand_name.trim(), user_id: req.user.id }
      });
      resolvedBrandId = brand.id;
    }

    const deal = await Deal.create({
      user_id: req.user.id,
      title, brand_id: resolvedBrandId, total_value, currency, stage: stage || 'inbound',
      description, posting_deadline, start_date, end_date, email_thread_id
    });

    const fullDeal = await Deal.findByPk(deal.id, {
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name', 'industry'] }]
    });
    res.status(201).json(fullDeal);
  } catch (err) {
    next(err);
  }
});

// GET /api/deals/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Brand, as: 'brand' },
        { model: Deliverable, as: 'deliverables', order: [['created_at', 'ASC']] },
        { model: Invoice, as: 'invoices' }
      ]
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (err) {
    next(err);
  }
});

// PUT /api/deals/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const updates = ['title', 'brand_id', 'total_value', 'currency', 'stage', 'description', 'posting_deadline', 'start_date', 'end_date', 'email_thread_id'];
    const data = {};
    updates.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    // Auto-timestamp stage transitions
    if (data.stage && STAGE_TIMESTAMPS[data.stage] && !deal[STAGE_TIMESTAMPS[data.stage]]) {
      data[STAGE_TIMESTAMPS[data.stage]] = new Date();
    }

    await deal.update(data);
    res.json(deal);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/deals/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    await deal.destroy();
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/deals/:id/stage
router.patch('/:id/stage', auth, async (req, res, next) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'Stage required' });

    const validStages = ['inbound', 'qualified', 'negotiation', 'contract_sent', 'in_production', 'client_review', 'posted', 'invoice_sent', 'paid', 'declined'];
    if (!validStages.includes(stage)) return res.status(400).json({ error: 'Invalid stage' });

    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const updates = { stage };
    if (STAGE_TIMESTAMPS[stage] && !deal[STAGE_TIMESTAMPS[stage]]) {
      updates[STAGE_TIMESTAMPS[stage]] = new Date();
    }

    await deal.update(updates);
    res.json(deal);
  } catch (err) {
    next(err);
  }
});

// Deliverables sub-routes
// GET /api/deals/:dealId/deliverables
router.get('/:dealId/deliverables', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const deliverables = await Deliverable.findAll({ where: { deal_id: req.params.dealId }, order: [['created_at', 'ASC']] });
    res.json(deliverables);
  } catch (err) {
    next(err);
  }
});

// POST /api/deals/:dealId/deliverables
router.post('/:dealId/deliverables', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const { title, type, platform, status, deadline, requirements, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const deliverable = await Deliverable.create({ deal_id: req.params.dealId, title, type, platform, status, deadline, requirements, notes });
    res.status(201).json(deliverable);
  } catch (err) {
    next(err);
  }
});

// PUT /api/deals/:dealId/deliverables/:id
router.put('/:dealId/deliverables/:id', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const deliverable = await Deliverable.findOne({ where: { id: req.params.id, deal_id: req.params.dealId } });
    if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });

    const { title, type, platform, status, deadline, requirements, notes } = req.body;
    await deliverable.update({ title, type, platform, status, deadline, requirements, notes });
    res.json(deliverable);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/deals/:dealId/deliverables/:id
router.delete('/:dealId/deliverables/:id', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const deliverable = await Deliverable.findOne({ where: { id: req.params.id, deal_id: req.params.dealId } });
    if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });

    await deliverable.destroy();
    res.json({ message: 'Deliverable deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/deals/:dealId/deliverables/:id/status
router.patch('/:dealId/deliverables/:id/status', auth, async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { id: req.params.dealId, user_id: req.user.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const deliverable = await Deliverable.findOne({ where: { id: req.params.id, deal_id: req.params.dealId } });
    if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });

    const { status } = req.body;
    await deliverable.update({ status });
    res.json(deliverable);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
