const express = require('express');
const { Invoice, Deal, Brand } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/invoices
router.get('/', auth, async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'title'], include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }] }],
      order: [['created_at', 'DESC']]
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices
router.post('/', auth, async (req, res, next) => {
  try {
    const { deal_id, amount, currency, due_date, notes } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });

    // Auto-generate invoice number
    const count = await Invoice.count({ where: { user_id: req.user.id } });
    const invoice_number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const invoice = await Invoice.create({
      user_id: req.user.id,
      deal_id, amount, currency: currency || 'INR', due_date, notes, invoice_number, status: 'draft'
    });
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Deal, as: 'deal', include: [{ model: Brand, as: 'brand' }] }]
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// PUT /api/invoices/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { amount, currency, due_date, notes, status } = req.body;
    await invoice.update({ amount, currency, due_date, notes, status });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const invoice = await Invoice.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const updates = { status };
    if (status === 'sent' && !invoice.sent_at) updates.sent_at = new Date();
    if (status === 'paid' && !invoice.paid_at) updates.paid_at = new Date();

    await invoice.update(updates);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
