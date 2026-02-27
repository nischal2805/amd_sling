const router = require('express').Router();
const { Op } = require('sequelize');
const { Deal, Brand, Revenue, Invoice, Deliverable } = require('../models');

// GET /dashboard — full dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [deals, revenues, invoices] = await Promise.all([
      Deal.findAll({ where: { user_id: userId }, include: [{ model: Brand, as: 'brand' }] }),
      Revenue.findAll({ where: { user_id: userId } }),
      Invoice.findAll({ where: { user_id: userId } }),
    ]);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const revenueThisMonth = revenues
      .filter((r) => new Date(r.received_at) >= thisMonthStart)
      .reduce((s, r) => s + parseFloat(r.amount), 0);

    const revenueLastMonth = revenues
      .filter((r) => {
        const d = new Date(r.received_at);
        return d >= lastMonthStart && d < thisMonthStart;
      })
      .reduce((s, r) => s + parseFloat(r.amount), 0);

    const totalRevenue = revenues.reduce((s, r) => s + parseFloat(r.amount), 0);
    const activeDeals = deals.filter((d) => !['completed', 'cancelled'].includes(d.stage)).length;
    const pipelineValue = deals
      .filter((d) => !['completed', 'cancelled'].includes(d.stage))
      .reduce((s, d) => s + parseFloat(d.value || 0), 0);

    const outstandingInvoices = invoices
      .filter((i) => ['sent', 'overdue'].includes(i.status))
      .reduce((s, i) => s + parseFloat(i.amount), 0);
    const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

    // Revenue last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentRevenue = revenues.filter((r) => new Date(r.received_at) >= sixMonthsAgo);
    const revenueByMonth = {};
    recentRevenue.forEach((r) => {
      const key = r.received_at.slice(0, 7);
      revenueByMonth[key] = (revenueByMonth[key] || 0) + parseFloat(r.amount);
    });

    const dealsByStage = deals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    }, {});

    res.json({
      data: {
        revenue_this_month: revenueThisMonth,
        revenue_last_month: revenueLastMonth,
        total_revenue: totalRevenue,
        active_deals: activeDeals,
        pipeline_value: pipelineValue,
        outstanding_invoices: outstandingInvoices,
        overdue_count: overdueCount,
        revenue_by_month: revenueByMonth,
        deals_by_stage: dealsByStage,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /pipeline — pipeline stats
router.get('/pipeline', async (req, res, next) => {
  try {
    const deals = await Deal.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }],
    });

    const stages = ['inbound', 'negotiation', 'contract_sent', 'in_production', 'completed', 'cancelled'];
    const pipeline = stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + parseFloat(d.value || 0), 0),
      };
    });

    res.json({ data: pipeline });
  } catch (err) {
    next(err);
  }
});

// GET /brands — revenue per brand
router.get('/brands', async (req, res, next) => {
  try {
    const revenues = await Revenue.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }],
    });

    const byBrand = {};
    revenues.forEach((r) => {
      const key = r.brand ? r.brand.name : 'Unknown';
      byBrand[key] = (byBrand[key] || 0) + parseFloat(r.amount);
    });

    const data = Object.entries(byBrand).map(([brand, total]) => ({ brand, total }));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /revenue — monthly revenue breakdown
router.get('/revenue', async (req, res, next) => {
  try {
    const revenues = await Revenue.findAll({ where: { user_id: req.user.id } });

    const byMonth = {};
    revenues.forEach((r) => {
      const key = r.received_at.slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + parseFloat(r.amount);
    });

    const data = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
