const express = require('express');
const { RevenueEntry, Brand, Deal, sequelize } = require('../models');
const auth = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();

// GET /api/revenue/summary — must come before /:id
router.get('/summary', auth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = { user_id: req.user.id };
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const entries = await RevenueEntry.findAll({
      where,
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }]
    });

    const total = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // By month
    const byMonthMap = {};
    entries.forEach(e => {
      const month = e.date.toString().slice(0, 7);
      byMonthMap[month] = (byMonthMap[month] || 0) + parseFloat(e.amount);
    });
    const by_month = Object.entries(byMonthMap).sort().map(([month, amount]) => ({ month, amount }));

    // By source
    const bySourceMap = {};
    entries.forEach(e => {
      bySourceMap[e.source_type] = (bySourceMap[e.source_type] || 0) + parseFloat(e.amount);
    });
    const by_source = Object.entries(bySourceMap).map(([source_type, amount]) => ({ source_type, amount }));

    // By platform
    const byPlatformMap = {};
    entries.forEach(e => {
      if (e.platform) byPlatformMap[e.platform] = (byPlatformMap[e.platform] || 0) + parseFloat(e.amount);
    });
    const by_platform = Object.entries(byPlatformMap).map(([platform, amount]) => ({ platform, amount }));

    // By brand
    const byBrandMap = {};
    entries.forEach(e => {
      if (e.brand) {
        const key = e.brand.name;
        byBrandMap[key] = (byBrandMap[key] || 0) + parseFloat(e.amount);
      }
    });
    const by_brand = Object.entries(byBrandMap).map(([brand_name, amount]) => ({ brand_name, amount })).sort((a, b) => b.amount - a.amount);

    res.json({ total, by_month, by_source, by_platform, by_brand });
  } catch (err) {
    next(err);
  }
});

// GET /api/revenue/forecast
router.get('/forecast', auth, async (req, res, next) => {
  try {
    const entries = await RevenueEntry.findAll({ where: { user_id: req.user.id } });
    const byMonthMap = {};
    entries.forEach(e => {
      const month = e.date.toString().slice(0, 7);
      byMonthMap[month] = (byMonthMap[month] || 0) + parseFloat(e.amount);
    });
    const months = Object.keys(byMonthMap).sort().slice(-3);
    const values = months.map(m => byMonthMap[m]);
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

    res.json({ forecast_next_month: Math.round(avg), based_on_months: months, monthly_values: values });
  } catch (err) {
    next(err);
  }
});

// GET /api/revenue
router.get('/', auth, async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.source_type) where.source_type = req.query.source_type;
    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date[Op.gte] = req.query.from;
      if (req.query.to) where.date[Op.lte] = req.query.to;
    }

    const entries = await RevenueEntry.findAll({
      where,
      include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: Deal, as: 'deal', attributes: ['id', 'title'] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// POST /api/revenue
router.post('/', auth, async (req, res, next) => {
  try {
    const { source_type, source_name, amount, currency, date, platform, notes, deal_id, brand_id } = req.body;
    if (!source_type || !amount || !date) return res.status(400).json({ error: 'source_type, amount, date required' });

    const entry = await RevenueEntry.create({
      user_id: req.user.id,
      source_type, source_name, amount, currency, date, platform, notes, deal_id, brand_id
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// PUT /api/revenue/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const entry = await RevenueEntry.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!entry) return res.status(404).json({ error: 'Revenue entry not found' });

    const { source_type, source_name, amount, currency, date, platform, notes, deal_id, brand_id } = req.body;
    await entry.update({ source_type, source_name, amount, currency, date, platform, notes, deal_id, brand_id });
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/revenue/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const entry = await RevenueEntry.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!entry) return res.status(404).json({ error: 'Revenue entry not found' });

    await entry.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
