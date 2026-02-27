const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const { Revenue, Brand, Deal } = require('../models');

// GET /summary — revenue summary stats
router.get('/summary', async (req, res, next) => {
  try {
    const entries = await Revenue.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }],
    });

    const total = entries.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    // by_month
    const by_month = {};
    entries.forEach((r) => {
      const key = r.received_at.slice(0, 7); // YYYY-MM
      by_month[key] = (by_month[key] || 0) + parseFloat(r.amount);
    });

    // by_source
    const by_source = {};
    entries.forEach((r) => {
      by_source[r.source_type] = (by_source[r.source_type] || 0) + parseFloat(r.amount);
    });

    // by_platform
    const by_platform = {};
    entries.forEach((r) => {
      if (r.platform) {
        by_platform[r.platform] = (by_platform[r.platform] || 0) + parseFloat(r.amount);
      }
    });

    // by_brand
    const by_brand = {};
    entries.forEach((r) => {
      if (r.brand) {
        by_brand[r.brand.name] = (by_brand[r.brand.name] || 0) + parseFloat(r.amount);
      }
    });

    res.json({ data: { total, by_month, by_source, by_platform, by_brand } });
  } catch (err) {
    next(err);
  }
});

// GET / — list all revenue entries (with optional ?from=&to= filters)
router.get('/', async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.from || req.query.to) {
      where.received_at = {};
      if (req.query.from) where.received_at[Op.gte] = req.query.from;
      if (req.query.to) where.received_at[Op.lte] = req.query.to;
    }

    const entries = await Revenue.findAll({
      where,
      include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: Deal, as: 'deal', attributes: ['id', 'title'] },
      ],
      order: [['received_at', 'DESC']],
    });
    res.json({ data: entries });
  } catch (err) {
    next(err);
  }
});

// POST / — create revenue entry
router.post('/', async (req, res, next) => {
  try {
    const { deal_id, brand_id, amount, currency, source_type, platform, received_at, notes } =
      req.body;
    if (!amount || !source_type || !received_at) {
      return res.status(400).json({ error: 'amount, source_type, and received_at are required' });
    }

    const entry = await Revenue.create({
      user_id: req.user.id,
      deal_id,
      brand_id,
      amount,
      currency,
      source_type,
      platform,
      received_at,
      notes,
    });
    res.status(201).json({ data: entry });
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update revenue entry
router.put('/:id', async (req, res, next) => {
  try {
    const entry = await Revenue.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!entry) return res.status(404).json({ error: 'Revenue entry not found' });

    const { deal_id, brand_id, amount, currency, source_type, platform, received_at, notes } =
      req.body;
    await entry.update({ deal_id, brand_id, amount, currency, source_type, platform, received_at, notes });
    res.json({ data: entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete revenue entry
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await Revenue.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!entry) return res.status(404).json({ error: 'Revenue entry not found' });

    await entry.destroy();
    res.json({ data: { message: 'Revenue entry deleted' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
