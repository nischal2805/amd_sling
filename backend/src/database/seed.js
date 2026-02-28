require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Brand, Deal, Deliverable, RevenueEntry, Invoice } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected. Seeding...');

    // Create demo user
    const passwordHash = await bcrypt.hash('demo1234', 10);
    const [user] = await User.upsert({
      email: 'demo@creatoros.com',
      password_hash: passwordHash,
      full_name: 'Alex Creator',
      niche: 'Tech & Productivity',
      primary_platform: 'youtube'
    }, { returning: true });

    console.log('✓ Demo user');

    // Create brands
    const brandData = [
      { name: 'Nike', industry: 'Sports & Fashion', website: 'https://nike.com', contact_name: 'Sarah Johnson', contact_email: 'sarah@nike.com', warmth_score: 85, payment_reliability: 'excellent' },
      { name: 'Squarespace', industry: 'SaaS / Website Builder', website: 'https://squarespace.com', contact_name: 'Mike Chen', contact_email: 'mike@squarespace.com', warmth_score: 90, payment_reliability: 'excellent' },
      { name: 'NordVPN', industry: 'Cybersecurity', website: 'https://nordvpn.com', contact_name: 'Anna Kowalski', contact_email: 'anna@nordvpn.com', warmth_score: 70, payment_reliability: 'good' },
      { name: 'Skillshare', industry: 'Education', website: 'https://skillshare.com', contact_name: 'James Lee', contact_email: 'james@skillshare.com', warmth_score: 75, payment_reliability: 'good' },
      { name: 'Notion', industry: 'Productivity SaaS', website: 'https://notion.so', contact_name: 'Emily Davis', contact_email: 'emily@notion.so', warmth_score: 95, payment_reliability: 'excellent' }
    ];

    const brands = [];
    for (const b of brandData) {
      const brand = await Brand.create({ ...b, user_id: user.id });
      brands.push(brand);
    }
    console.log('✓ 5 brands');

    // Create deals across different stages
    const dealsData = [
      {
        brand: brands[0], // Nike
        title: 'Nike Air Max Summer Campaign',
        total_value: 12000,
        stage: 'in_production',
        posting_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        description: 'Summer campaign featuring new Air Max line. 2 YouTube videos + 3 Instagram posts.',
        deliverables: [
          { title: 'YouTube Review Video', type: 'youtube_video', platform: 'youtube', status: 'in_progress', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
          { title: 'YouTube B-Roll Shorts', type: 'youtube_video', platform: 'youtube', status: 'not_started', deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
          { title: 'Instagram Story Series', type: 'instagram_post', platform: 'instagram', status: 'not_started', deadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        brand: brands[1], // Squarespace
        title: 'Squarespace Q3 Integration',
        total_value: 8500,
        stage: 'posted',
        posting_deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Integration in productivity tutorial video.',
        contract_signed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        deliverables: [
          { title: 'YouTube Tutorial Integration', type: 'youtube_video', platform: 'youtube', status: 'completed' },
        ]
      },
      {
        brand: brands[2], // NordVPN
        title: 'NordVPN Security Series',
        total_value: 6000,
        stage: 'negotiation',
        posting_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Security awareness series — 3 integrations across YouTube and LinkedIn.',
        deliverables: [
          { title: 'YouTube Video Integration', type: 'youtube_video', platform: 'youtube', status: 'not_started' },
          { title: 'LinkedIn Article', type: 'blog_post', platform: 'linkedin', status: 'not_started' }
        ]
      },
      {
        brand: brands[3], // Skillshare
        title: 'Skillshare Creative Workflow Series',
        total_value: 4500,
        stage: 'contract_sent',
        posting_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        description: 'Showcase Skillshare in productivity workflow video.',
        contract_sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        deliverables: [
          { title: 'YouTube Workflow Video', type: 'youtube_video', platform: 'youtube', status: 'not_started' }
        ]
      },
      {
        brand: brands[4], // Notion
        title: 'Notion Workspace Setup Guide',
        total_value: 9000,
        stage: 'paid',
        posting_deadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        description: 'Full Notion setup guide video, sponsored integration.',
        contract_signed_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        invoice_sent_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        payment_received_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        deliverables: [
          { title: 'YouTube Full Setup Guide', type: 'youtube_video', platform: 'youtube', status: 'completed' },
          { title: 'LinkedIn Write-up', type: 'blog_post', platform: 'linkedin', status: 'completed' }
        ]
      },
      {
        brand: brands[1], // Squarespace
        title: 'Squarespace Portfolio Template Feature',
        total_value: 7000,
        stage: 'inbound',
        posting_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        description: 'Feature Squarespace portfolio templates in creator tools video.',
        deliverables: []
      },
      {
        brand: brands[0], // Nike
        title: 'Nike Training App Review',
        total_value: 15000,
        stage: 'qualified',
        posting_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        description: 'Full app review + 30-day training challenge video.',
        deliverables: [
          { title: 'YouTube App Review', type: 'youtube_video', platform: 'youtube', status: 'not_started' },
          { title: 'Instagram Reel Challenge', type: 'instagram_reel', platform: 'instagram', status: 'not_started' }
        ]
      },
      {
        brand: brands[2], // NordVPN
        title: 'NordVPN Holiday Promo',
        total_value: 5500,
        stage: 'invoice_sent',
        posting_deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Holiday sale promotion integration.',
        contract_signed_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        invoice_sent_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        deliverables: [
          { title: 'YouTube Integration', type: 'youtube_video', platform: 'youtube', status: 'completed' }
        ]
      }
    ];

    const deals = [];
    for (const d of dealsData) {
      const { brand, deliverables: delivList, ...dealFields } = d;
      const deal = await Deal.create({ ...dealFields, user_id: user.id, brand_id: brand.id });
      deals.push(deal);
      for (const deliv of delivList) {
        await Deliverable.create({ ...deliv, deal_id: deal.id });
      }
    }
    console.log('✓ 8 deals + deliverables');

    // Update brand stats
    await Brand.update({ total_deals: 2, total_revenue: 21000, average_deal_value: 10500, warmth_score: 85, last_collaboration_date: new Date() }, { where: { id: brands[0].id } });
    await Brand.update({ total_deals: 2, total_revenue: 15500, average_deal_value: 7750, warmth_score: 90, last_collaboration_date: new Date() }, { where: { id: brands[1].id } });
    await Brand.update({ total_deals: 2, total_revenue: 5500, average_deal_value: 5500, warmth_score: 70, last_collaboration_date: new Date() }, { where: { id: brands[2].id } });
    await Brand.update({ total_deals: 1, total_revenue: 0, average_deal_value: 4500, warmth_score: 75 }, { where: { id: brands[3].id } });
    await Brand.update({ total_deals: 1, total_revenue: 9000, average_deal_value: 9000, warmth_score: 95, last_collaboration_date: new Date() }, { where: { id: brands[4].id } });

    // Create revenue entries (12 entries over last 6 months)
    const now = new Date();
    const revenueData = [
      // Month -5
      { source_type: 'sponsorship', source_name: 'Notion', amount: 9000, date: new Date(now.getFullYear(), now.getMonth() - 5, 15), platform: 'youtube', brand_id: brands[4].id, deal_id: deals[4].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 1240, date: new Date(now.getFullYear(), now.getMonth() - 5, 28), platform: 'youtube' },
      // Month -4
      { source_type: 'sponsorship', source_name: 'NordVPN', amount: 5500, date: new Date(now.getFullYear(), now.getMonth() - 4, 10), platform: 'youtube', brand_id: brands[2].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 1380, date: new Date(now.getFullYear(), now.getMonth() - 4, 28), platform: 'youtube' },
      { source_type: 'affiliate', source_name: 'Amazon Associates', amount: 340, date: new Date(now.getFullYear(), now.getMonth() - 4, 20), platform: 'youtube' },
      // Month -3
      { source_type: 'sponsorship', source_name: 'Squarespace', amount: 8500, date: new Date(now.getFullYear(), now.getMonth() - 3, 5), platform: 'youtube', brand_id: brands[1].id, deal_id: deals[1].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 1520, date: new Date(now.getFullYear(), now.getMonth() - 3, 28), platform: 'youtube' },
      { source_type: 'membership', source_name: 'Channel Memberships', amount: 890, date: new Date(now.getFullYear(), now.getMonth() - 3, 15), platform: 'youtube' },
      // Month -2
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 1650, date: new Date(now.getFullYear(), now.getMonth() - 2, 28), platform: 'youtube' },
      { source_type: 'affiliate', source_name: 'Amazon Associates', amount: 480, date: new Date(now.getFullYear(), now.getMonth() - 2, 20), platform: 'youtube' },
      { source_type: 'membership', source_name: 'Channel Memberships', amount: 950, date: new Date(now.getFullYear(), now.getMonth() - 2, 15), platform: 'youtube' },
      // This month
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 920, date: new Date(now.getFullYear(), now.getMonth(), 15), platform: 'youtube' }
    ];

    for (const r of revenueData) {
      await RevenueEntry.create({ ...r, user_id: user.id });
    }
    console.log('✓ 12 revenue entries');

    // Create 3 invoices (1 overdue, 2 outstanding)
    await Invoice.create({
      deal_id: deals[4].id, // Notion - paid
      user_id: user.id,
      invoice_number: 'INV-2024-001',
      amount: 9000,
      currency: 'USD',
      status: 'paid',
      due_date: new Date(now.getFullYear(), now.getMonth() - 5, 30),
      sent_at: new Date(now.getFullYear(), now.getMonth() - 5, 20),
      paid_at: new Date(now.getFullYear(), now.getMonth() - 5, 28)
    });

    await Invoice.create({
      deal_id: deals[7].id, // NordVPN Holiday - invoice sent (overdue)
      user_id: user.id,
      invoice_number: 'INV-2024-002',
      amount: 5500,
      currency: 'USD',
      status: 'overdue',
      due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      sent_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12),
      notes: 'Net 7 terms — follow up required'
    });

    await Invoice.create({
      deal_id: deals[0].id, // Nike - draft
      user_id: user.id,
      invoice_number: 'INV-2024-003',
      amount: 12000,
      currency: 'USD',
      status: 'draft',
      due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20),
      notes: 'To be sent on delivery'
    });

    await Invoice.create({
      deal_id: deals[1].id, // Squarespace posted
      user_id: user.id,
      invoice_number: 'INV-2024-004',
      amount: 8500,
      currency: 'USD',
      status: 'sent',
      due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      sent_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4)
    });

    console.log('✓ 4 invoices (1 overdue, 1 sent, 1 draft, 1 paid)');

    console.log('\n✅ Seed complete!');
    console.log('   Login: demo@creatoros.com / demo1234');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
