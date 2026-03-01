const express = require('express');
const { Deal, Invoice, RevenueEntry, Brand, Deliverable, sequelize } = require('../models');
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

// GET /api/analytics/health — Business Health Dashboard
router.get('/health', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all data
    const [brands, deals, revenue, invoices] = await Promise.all([
      Brand.findAll({ where: { user_id: userId } }),
      Deal.findAll({ where: { user_id: userId } }),
      RevenueEntry.findAll({ where: { user_id: userId }, order: [['date', 'ASC']] }),
      Invoice.findAll({ where: { user_id: userId } })
    ]);

    const totalRevenue = revenue.reduce((s, r) => s + parseFloat(r.amount), 0);

    // 1. Revenue Concentration (HHI by brand) — 0-100, lower is better diversified
    const revenueByBrand = {};
    revenue.forEach(r => {
      const key = r.brand_id || '_direct';
      revenueByBrand[key] = (revenueByBrand[key] || 0) + parseFloat(r.amount);
    });
    const brandShares = Object.values(revenueByBrand).map(v => totalRevenue > 0 ? (v / totalRevenue) : 0);
    const hhi = brandShares.reduce((s, share) => s + Math.pow(share * 100, 2), 0);
    // Normalize HHI: 10000 = single brand, ~0 = perfectly diverse
    const concentrationRisk = Math.min(100, Math.round(hhi / 100));

    // 2. Brand Diversity Score (0-100, higher is better)
    const activeBrandCount = brands.filter(b => b.total_deals > 0 || parseFloat(b.total_revenue || 0) > 0).length;
    const brandDiversity = Math.min(100, activeBrandCount * 15); // 7+ brands = 100

    // 3. Income Stability — coefficient of variation of monthly revenue
    const byMonth = {};
    revenue.forEach(r => {
      const m = r.date.toString().slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + parseFloat(r.amount);
    });
    const monthlyValues = Object.values(byMonth);
    const avgMonthly = monthlyValues.length > 0 ? monthlyValues.reduce((s, v) => s + v, 0) / monthlyValues.length : 0;
    const stdDev = monthlyValues.length > 1 ? Math.sqrt(monthlyValues.reduce((s, v) => s + Math.pow(v - avgMonthly, 2), 0) / monthlyValues.length) : 0;
    const cv = avgMonthly > 0 ? stdDev / avgMonthly : 1;
    const incomeStability = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));

    // 4. Pipeline Health — ratio of active deals to capacity
    const activeDeals = deals.filter(d => !['paid', 'declined'].includes(d.stage));
    const paidDeals = deals.filter(d => d.stage === 'paid');
    const declinedDeals = deals.filter(d => d.stage === 'declined');
    const winRate = (paidDeals.length + declinedDeals.length) > 0
      ? Math.round(paidDeals.length / (paidDeals.length + declinedDeals.length) * 100) : 0;
    const pipelineHealth = Math.min(100, Math.round((activeDeals.length * 10) + (winRate * 0.5)));

    // 5. Payment Health — % invoices paid on time
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const totalInvoiced = invoices.length;
    const paymentHealth = totalInvoiced > 0
      ? Math.round((paidInvoices.length / totalInvoiced) * 100)
      : 100;

    // 6. Posting Consistency — based on deliverable completion rate
    const allDeliverables = await Deliverable.findAll({
      include: [{ model: Deal, where: { user_id: userId }, attributes: [] }]
    });
    const completedDelivs = allDeliverables.filter(d => ['completed', 'posted'].includes(d.status));
    const deliveryRate = allDeliverables.length > 0
      ? Math.round((completedDelivs.length / allDeliverables.length) * 100)
      : 0;

    // Overall score (weighted average)
    const overallScore = Math.round(
      (100 - concentrationRisk) * 0.2 +
      brandDiversity * 0.15 +
      incomeStability * 0.2 +
      pipelineHealth * 0.15 +
      paymentHealth * 0.15 +
      deliveryRate * 0.15
    );

    // Cash flow forecast
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const next60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const pendingInvoiceValue = invoices
      .filter(i => ['sent', 'overdue'].includes(i.status))
      .reduce((s, i) => s + parseFloat(i.amount), 0);

    const pipelineExpected = activeDeals.reduce((s, d) => s + (parseFloat(d.total_value) || 0), 0);

    // Deals nearing payment (invoice_sent stage)
    const nearPayment = deals.filter(d => d.stage === 'invoice_sent')
      .reduce((s, d) => s + (parseFloat(d.total_value) || 0), 0);

    // Brand renewal candidates (brands with last collab > 90 days ago)
    const renewalCandidates = brands.filter(b => {
      if (!b.last_collaboration_date) return false;
      const daysSince = (now - new Date(b.last_collaboration_date)) / (1000 * 60 * 60 * 24);
      return daysSince > 60 && daysSince < 365 && (b.warmth_score || 0) >= 40;
    }).map(b => ({
      id: b.id,
      name: b.name,
      last_collab: b.last_collaboration_date,
      days_since: Math.round((now - new Date(b.last_collaboration_date)) / (1000 * 60 * 60 * 24)),
      warmth: b.warmth_score,
      total_revenue: parseFloat(b.total_revenue || 0)
    }));

    // Risk alerts
    const alerts = [];
    if (concentrationRisk > 60) alerts.push({ type: 'warning', message: 'High revenue concentration — over-reliant on few brands' });
    if (overdueInvoices.length > 0) alerts.push({ type: 'danger', message: `${overdueInvoices.length} overdue invoice(s) — follow up immediately` });
    if (incomeStability < 40) alerts.push({ type: 'warning', message: 'Volatile monthly income — consider recurring revenue streams' });
    if (activeDeals.length < 2) alerts.push({ type: 'info', message: 'Low pipeline — prospect for more inbound deals' });
    if (brandDiversity < 30) alerts.push({ type: 'warning', message: 'Low brand diversity — expand your client base' });
    if (renewalCandidates.length > 0) alerts.push({ type: 'info', message: `${renewalCandidates.length} brand(s) due for renewal outreach` });

    res.json({
      overall_score: overallScore,
      metrics: {
        concentration_risk: concentrationRisk,
        brand_diversity: brandDiversity,
        income_stability: incomeStability,
        pipeline_health: pipelineHealth,
        payment_health: paymentHealth,
        delivery_rate: deliveryRate
      },
      cash_flow: {
        pending_invoice_value: pendingInvoiceValue,
        pipeline_expected: pipelineExpected,
        near_payment: nearPayment,
        avg_monthly_revenue: Math.round(avgMonthly)
      },
      renewal_candidates: renewalCandidates,
      alerts,
      summary: {
        total_brands: brands.length,
        active_brands: activeBrandCount,
        total_deals: deals.length,
        active_deals: activeDeals.length,
        win_rate: winRate,
        total_revenue: totalRevenue,
        total_invoiced: invoices.reduce((s, i) => s + parseFloat(i.amount), 0),
        overdue_count: overdueInvoices.length
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
