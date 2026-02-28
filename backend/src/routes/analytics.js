const express = require('express');
const { Deal, Invoice, RevenueEntry, Brand, sequelize } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Revenue this month
    const thisMonthRevenue = await RevenueEntry.sum('amount', {
      where: { user_id: userId, date: { [Op.gte]: startOfMonth } }
    });

    // Revenue last month
    const lastMonthRevenue = await RevenueEntry.sum('amount', {
      where: { user_id: userId, date: { [Op.between]: [startOfLastMonth, endOfLastMonth] } }
    });

    // Revenue this year
    const thisYearRevenue = await RevenueEntry.sum('amount', {
      where: { user_id: userId, date: { [Op.gte]: startOfYear } }
    });

    const thisMonth = parseFloat(thisMonthRevenue) || 0;
    const lastMonth = parseFloat(lastMonthRevenue) || 0;
    const momGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;

    // Active pipeline
    const activeStages = ['inbound', 'qualified', 'negotiation', 'contract_sent', 'in_production', 'client_review', 'posted', 'invoice_sent'];
    const activeDeals = await Deal.findAll({
      where: { user_id: userId, stage: { [Op.in]: activeStages } }
    });
    const pipelineValue = activeDeals.reduce((sum, d) => sum + (parseFloat(d.total_value) || 0), 0);

    const byStage = {};
    activeDeals.forEach(d => {
      byStage[d.stage] = (byStage[d.stage] || 0) + 1;
    });

    // Invoices
    const outstandingInvoices = await Invoice.findAll({
      where: { user_id: userId, status: { [Op.in]: ['sent', 'overdue'] } }
    });
    const outstandingValue = outstandingInvoices.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const overdueCount = outstandingInvoices.filter(i => i.status === 'overdue').length;

    // Top brands
    const allRevenue = await RevenueEntry.findAll({
      where: { user_id: userId, brand_id: { [Op.ne]: null } },
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }]
    });
    const brandMap = {};
    allRevenue.forEach(r => {
      if (!r.brand) return;
      const key = r.brand.id;
      if (!brandMap[key]) brandMap[key] = { name: r.brand.name, total_revenue: 0, deal_count: 0 };
      brandMap[key].total_revenue += parseFloat(r.amount);
    });

    const dealCounts = await Deal.findAll({ where: { user_id: userId } });
    dealCounts.forEach(d => {
      if (d.brand_id && brandMap[d.brand_id]) brandMap[d.brand_id].deal_count++;
    });

    const top_brands = Object.values(brandMap)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);

    // Recent deals
    const recent_deals = await Deal.findAll({
      where: { user_id: userId },
      include: [{ model: Brand, as: 'brand', attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']],
      limit: 5
    });

    res.json({
      revenue: {
        this_month: thisMonth,
        last_month: lastMonth,
        this_year: parseFloat(thisYearRevenue) || 0,
        mom_growth_percent: parseFloat(momGrowth)
      },
      pipeline: {
        total_active_value: pipelineValue,
        deals_count: activeDeals.length,
        by_stage: byStage
      },
      invoices: {
        outstanding_count: outstandingInvoices.length,
        outstanding_value: outstandingValue,
        overdue_count: overdueCount
      },
      top_brands,
      recent_deals
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/pipeline
router.get('/pipeline', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deals = await Deal.findAll({ where: { user_id: userId } });

    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === 'paid');
    const lostDeals = deals.filter(d => d.stage === 'declined');
    const activeDeals = deals.filter(d => !['paid', 'declined'].includes(d.stage));

    const totalValue = activeDeals.reduce((s, d) => s + (parseFloat(d.total_value) || 0), 0);
    const avgDealSize = wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + (parseFloat(d.total_value) || 0), 0) / wonDeals.length
      : 0;

    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length) * 100).toFixed(1)
      : 0;

    const byStage = {};
    deals.forEach(d => {
      if (!byStage[d.stage]) byStage[d.stage] = { count: 0, value: 0 };
      byStage[d.stage].count++;
      byStage[d.stage].value += parseFloat(d.total_value) || 0;
    });

    res.json({ total_active_value: totalValue, win_rate: parseFloat(winRate), avg_deal_size: avgDealSize, by_stage: byStage });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/brands
router.get('/brands', auth, async (req, res, next) => {
  try {
    const brands = await Brand.findAll({ where: { user_id: req.user.id } });
    res.json(brands.map(b => ({
      id: b.id,
      name: b.name,
      total_revenue: parseFloat(b.total_revenue) || 0,
      total_deals: b.total_deals,
      warmth_score: b.warmth_score,
      payment_reliability: b.payment_reliability
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/revenue
router.get('/revenue', auth, async (req, res, next) => {
  try {
    const entries = await RevenueEntry.findAll({ where: { user_id: req.user.id }, order: [['date', 'ASC']] });

    const byMonthMap = {};
    entries.forEach(e => {
      const month = e.date.toString().slice(0, 7);
      byMonthMap[month] = (byMonthMap[month] || 0) + parseFloat(e.amount);
    });

    const monthly = Object.entries(byMonthMap).map(([month, amount]) => ({ month, amount }));
    res.json({ monthly });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
