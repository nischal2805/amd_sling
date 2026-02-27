const router = require('express').Router();
const { Op } = require('sequelize');
const { Brand, Deal, Revenue } = require('../models');

// GET / — list brands with deal count and total revenue
router.get('/', async (req, res, next) => {
  try {
    const brands = await Brand.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Deal, attributes: ['id'] },
        { model: Revenue, attributes: ['amount'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const data = brands.map((b) => {
      const obj = b.toJSON();
      obj.deal_count = obj.Deals ? obj.Deals.length : 0;
      obj.total_revenue = obj.Revenues
        ? obj.Revenues.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
        : 0;
      delete obj.Deals;
      delete obj.Revenues;
      return obj;
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST / — create brand
router.post('/', async (req, res, next) => {
  try {
    const { name, website, contact_name, contact_email, warmth_score, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const brand = await Brand.create({
      user_id: req.user.id,
      name,
      website,
      contact_name,
      contact_email,
      warmth_score,
      notes,
    });
    res.status(201).json({ data: brand });
  } catch (err) {
    next(err);
  }
});

// GET /:id — get brand with deals
router.get('/:id', async (req, res, next) => {
  try {
    const brand = await Brand.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Deal }],
    });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json({ data: brand });
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update brand
router.put('/:id', async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const { name, website, contact_name, contact_email, warmth_score, notes } = req.body;
    await brand.update({ name, website, contact_name, contact_email, warmth_score, notes });
    res.json({ data: brand });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete brand
router.delete('/:id', async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    await brand.destroy();
    res.json({ data: { message: 'Brand deleted' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
