const router = require('express').Router();
const { Invoice, Brand, Deal } = require('../models');

// GET / — list all invoices
router.get('/', async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: Deal, as: 'deal', attributes: ['id', 'title'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ data: invoices });
  } catch (err) {
    next(err);
  }
});

// POST / — create invoice
router.post('/', async (req, res, next) => {
  try {
    const { deal_id, brand_id, invoice_number, amount, currency, status, due_date, paid_at, notes } =
      req.body;
    if (!invoice_number || !amount) {
      return res.status(400).json({ error: 'invoice_number and amount are required' });
    }

    const invoice = await Invoice.create({
      user_id: req.user.id,
      deal_id,
      brand_id,
      invoice_number,
      amount,
      currency,
      status,
      due_date,
      paid_at,
      notes,
    });
    res.status(201).json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// GET /:id — get invoice
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Brand, as: 'brand' },
        { model: Deal, as: 'deal', attributes: ['id', 'title'] },
      ],
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update invoice
router.put('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { deal_id, brand_id, invoice_number, amount, currency, status, due_date, paid_at, notes } =
      req.body;
    await invoice.update({ deal_id, brand_id, invoice_number, amount, currency, status, due_date, paid_at, notes });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/status — update status only
router.patch('/:id/status', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const update = { status };
    if (status === 'paid' && !invoice.paid_at) update.paid_at = new Date().toISOString().slice(0, 10);

    await invoice.update(update);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete invoice
router.delete('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    await invoice.destroy();
    res.json({ data: { message: 'Invoice deleted' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
