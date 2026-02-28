const express = require('express');
const { Brand, Deal, RevenueEntry } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/brands
router.get('/', auth, async (req, res, next) => {
  try {
    const brands = await Brand.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']]
    });
    res.json(brands);
  } catch (err) {
    next(err);
  }
});

// POST /api/brands
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, website, industry, contact_name, contact_email, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name required' });

    const brand = await Brand.create({
      user_id: req.user.id,
      name, website, industry, contact_name, contact_email, notes
    });
    res.status(201).json(brand);
  } catch (err) {
    next(err);
  }
});

// GET /api/brands/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const brand = await Brand.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Deal, as: 'deals', order: [['created_at', 'DESC']] }]
    });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    next(err);
  }
});

// PUT /api/brands/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const { name, website, industry, contact_name, contact_email, notes, warmth_score, payment_reliability } = req.body;
    await brand.update({ name, website, industry, contact_name, contact_email, notes, warmth_score, payment_reliability });
    res.json(brand);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/brands/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    await brand.destroy();
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
