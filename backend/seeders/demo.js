require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Brand, Deal, Deliverable, Revenue, Invoice } = require('../src/models');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

(async () => {
  await sequelize.sync({ force: false });

  // Check if demo user already exists
  const existing = await User.findOne({ where: { email: 'demo@creatoros.com' } });
  if (existing) {
    console.log('Demo user already exists, skipping seed.');
    await sequelize.close();
    return;
  }

  console.log('Seeding demo data...');

  // ── User ──────────────────────────────────────────────────
  const user = await User.create({
    email: 'demo@creatoros.com',
    password: await bcrypt.hash('demo1234', 10),
    name: 'Alex Creator',
    niche: 'Tech & Productivity',
    follower_count: 125000,
  });

  // ── Brands ────────────────────────────────────────────────
  const [nike, squarespace, nordvpn, skillshare, notion] = await Brand.bulkCreate([
    {
      user_id: user.id,
      name: 'Nike',
      website: 'https://nike.com',
      contact_name: 'Sarah Johnson',
      contact_email: 'sarah.johnson@nike.com',
      warmth_score: 4,
      notes: 'Interested in fitness content series',
    },
    {
      user_id: user.id,
      name: 'Squarespace',
      website: 'https://squarespace.com',
      contact_name: 'Mike Chen',
      contact_email: 'mike.chen@squarespace.com',
      warmth_score: 5,
      notes: 'Long-term partner, quarterly deals',
    },
    {
      user_id: user.id,
      name: 'NordVPN',
      website: 'https://nordvpn.com',
      contact_name: 'Anna Kowalski',
      contact_email: 'anna.k@nordvpn.com',
      warmth_score: 3,
      notes: 'Recurring sponsor, prefers YouTube integrations',
    },
    {
      user_id: user.id,
      name: 'Skillshare',
      website: 'https://skillshare.com',
      contact_name: 'James Park',
      contact_email: 'jpark@skillshare.com',
      warmth_score: 4,
      notes: 'Education niche fit',
    },
    {
      user_id: user.id,
      name: 'Notion',
      website: 'https://notion.so',
      contact_name: 'Emily Torres',
      contact_email: 'emily@notion.so',
      warmth_score: 5,
      notes: 'Perfect brand fit, productivity niche',
    },
  ]);

  // ── Deals ─────────────────────────────────────────────────
  const [deal1, deal2, deal3, deal4, deal5, deal6, deal7, deal8] = await Deal.bulkCreate([
    {
      user_id: user.id,
      brand_id: notion.id,
      title: 'Notion — Productivity Setup Video',
      stage: 'in_production',
      value: 8500,
      currency: 'USD',
      posting_deadline: daysAgo(-14),
      notes: 'Full YouTube integration + 3 IG stories',
    },
    {
      user_id: user.id,
      brand_id: squarespace.id,
      title: 'Squarespace — Portfolio Website Tutorial',
      stage: 'contract_sent',
      value: 12000,
      currency: 'USD',
      posting_deadline: daysAgo(-30),
      notes: 'Awaiting signed contract',
    },
    {
      user_id: user.id,
      brand_id: nordvpn.id,
      title: 'NordVPN — Privacy & Security Video',
      stage: 'negotiation',
      value: 6000,
      currency: 'USD',
      notes: 'Negotiating on deliverables count',
    },
    {
      user_id: user.id,
      brand_id: nike.id,
      title: 'Nike — Morning Routine Sponsorship',
      stage: 'inbound',
      value: 15000,
      currency: 'USD',
      notes: 'Initial outreach from brand',
    },
    {
      user_id: user.id,
      brand_id: skillshare.id,
      title: 'Skillshare — Learn Design Series',
      stage: 'completed',
      value: 5000,
      currency: 'USD',
      posting_deadline: daysAgo(45),
    },
    {
      user_id: user.id,
      brand_id: squarespace.id,
      title: 'Squarespace — Q1 YouTube Integration',
      stage: 'completed',
      value: 9000,
      currency: 'USD',
      posting_deadline: daysAgo(90),
    },
    {
      user_id: user.id,
      brand_id: nordvpn.id,
      title: 'NordVPN — Travel Vlog Integration',
      stage: 'cancelled',
      value: 4000,
      currency: 'USD',
      notes: 'Brand pulled budget',
    },
    {
      user_id: user.id,
      brand_id: notion.id,
      title: 'Notion — Student Productivity Campaign',
      stage: 'negotiation',
      value: 7500,
      currency: 'USD',
      notes: 'Back-to-school campaign, multiple deliverables',
    },
  ]);

  // ── Deliverables ──────────────────────────────────────────
  await Deliverable.bulkCreate([
    {
      deal_id: deal1.id,
      type: 'youtube_integration',
      platform: 'YouTube',
      quantity: 1,
      details: '60-90 second mid-roll integration',
      status: 'in_progress',
    },
    {
      deal_id: deal1.id,
      type: 'instagram_story',
      platform: 'Instagram',
      quantity: 3,
      details: 'Story swipe-ups with affiliate link',
      status: 'pending',
    },
    {
      deal_id: deal2.id,
      type: 'youtube_dedicated',
      platform: 'YouTube',
      quantity: 1,
      details: 'Full tutorial video featuring Squarespace',
      status: 'pending',
    },
    {
      deal_id: deal3.id,
      type: 'youtube_integration',
      platform: 'YouTube',
      quantity: 2,
      details: '30-second integration in two videos',
      status: 'pending',
    },
    {
      deal_id: deal5.id,
      type: 'youtube_integration',
      platform: 'YouTube',
      quantity: 1,
      details: 'Design course promotion',
      status: 'completed',
    },
    {
      deal_id: deal8.id,
      type: 'youtube_integration',
      platform: 'YouTube',
      quantity: 1,
      details: 'Back-to-school video integration',
      status: 'pending',
    },
    {
      deal_id: deal8.id,
      type: 'instagram_reel',
      platform: 'Instagram',
      quantity: 2,
      details: 'Short-form reels highlighting Notion templates',
      status: 'pending',
    },
  ]);

  // ── Revenue ───────────────────────────────────────────────
  await Revenue.bulkCreate([
    {
      user_id: user.id,
      deal_id: deal6.id,
      brand_id: squarespace.id,
      amount: 9000,
      currency: 'USD',
      source_type: 'sponsorship',
      platform: 'YouTube',
      received_at: monthsAgo(5),
      notes: 'Q1 Squarespace deal paid',
    },
    {
      user_id: user.id,
      deal_id: deal5.id,
      brand_id: skillshare.id,
      amount: 5000,
      currency: 'USD',
      source_type: 'sponsorship',
      platform: 'YouTube',
      received_at: monthsAgo(4),
    },
    {
      user_id: user.id,
      brand_id: nordvpn.id,
      amount: 3500,
      currency: 'USD',
      source_type: 'sponsorship',
      platform: 'YouTube',
      received_at: monthsAgo(4),
      notes: 'NordVPN Q1 payment',
    },
    {
      user_id: user.id,
      amount: 1200,
      currency: 'USD',
      source_type: 'affiliate',
      platform: 'YouTube',
      received_at: monthsAgo(3),
      notes: 'Amazon affiliate earnings',
    },
    {
      user_id: user.id,
      amount: 850,
      currency: 'USD',
      source_type: 'affiliate',
      platform: 'Instagram',
      received_at: monthsAgo(3),
      notes: 'LTK affiliate commission',
    },
    {
      user_id: user.id,
      brand_id: notion.id,
      amount: 4200,
      currency: 'USD',
      source_type: 'sponsorship',
      platform: 'YouTube',
      received_at: monthsAgo(3),
      notes: 'Notion spring campaign',
    },
    {
      user_id: user.id,
      amount: 2800,
      currency: 'USD',
      source_type: 'product',
      platform: 'YouTube',
      received_at: monthsAgo(2),
      notes: 'Digital product sales — productivity templates',
    },
    {
      user_id: user.id,
      amount: 950,
      currency: 'USD',
      source_type: 'affiliate',
      platform: 'YouTube',
      received_at: monthsAgo(2),
      notes: 'Tech gear affiliate',
    },
    {
      user_id: user.id,
      brand_id: squarespace.id,
      amount: 6500,
      currency: 'USD',
      source_type: 'sponsorship',
      platform: 'YouTube',
      received_at: monthsAgo(2),
      notes: 'Squarespace Q2 advance',
    },
    {
      user_id: user.id,
      amount: 1800,
      currency: 'USD',
      source_type: 'affiliate',
      platform: 'YouTube',
      received_at: monthsAgo(1),
      notes: 'Software affiliate commissions',
    },
    {
      user_id: user.id,
      amount: 3200,
      currency: 'USD',
      source_type: 'product',
      platform: 'YouTube',
      received_at: monthsAgo(1),
      notes: 'Course launch revenue',
    },
    {
      user_id: user.id,
      brand_id: nordvpn.id,
      amount: 4800,
      currency: 'USD',
      source_type: 'sponsorship',
      platform: 'YouTube',
      received_at: daysAgo(15),
      notes: 'NordVPN summer campaign',
    },
  ]);

  // ── Invoices ──────────────────────────────────────────────
  await Invoice.bulkCreate([
    {
      user_id: user.id,
      brand_id: squarespace.id,
      deal_id: deal2.id,
      invoice_number: 'INV-2024-001',
      amount: 12000,
      currency: 'USD',
      status: 'sent',
      due_date: daysAgo(-7),
      notes: 'Squarespace Portfolio Tutorial — net 30',
    },
    {
      user_id: user.id,
      brand_id: nordvpn.id,
      invoice_number: 'INV-2024-002',
      amount: 6000,
      currency: 'USD',
      status: 'overdue',
      due_date: daysAgo(14),
      notes: 'NordVPN Privacy Video — OVERDUE',
    },
    {
      user_id: user.id,
      brand_id: notion.id,
      deal_id: deal1.id,
      invoice_number: 'INV-2024-003',
      amount: 8500,
      currency: 'USD',
      status: 'draft',
      due_date: daysAgo(-30),
      notes: 'Notion Productivity Setup — draft pending review',
    },
  ]);

  console.log('✅ Demo data seeded successfully!');
  console.log('   Login: demo@creatoros.com / demo1234');
  await sequelize.close();
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
