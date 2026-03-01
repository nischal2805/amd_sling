const express = require('express');
const { NegotiationNote, Brand, Deal } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/negotiations?brand_id=...
router.get('/', auth, async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.brand_id) where.brand_id = req.query.brand_id;
    if (req.query.deal_id) where.deal_id = req.query.deal_id;

    const notes = await NegotiationNote.findAll({
      where,
      include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: Deal, as: 'deal', attributes: ['id', 'title'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// POST /api/negotiations
router.post('/', auth, async (req, res, next) => {
  try {
    const { brand_id, deal_id, note_type, content, metadata } = req.body;
    if (!brand_id || !content) return res.status(400).json({ error: 'brand_id and content required' });

    const note = await NegotiationNote.create({
      user_id: req.user.id,
      brand_id,
      deal_id,
      note_type: note_type || 'general',
      content,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/negotiations/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const note = await NegotiationNote.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    await note.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
