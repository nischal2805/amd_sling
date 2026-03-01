require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Brand, Deal, Deliverable, RevenueEntry, Invoice, ContentPost, NegotiationNote, TeamMember, Ticket } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected. Syncing schema...');
    await sequelize.sync({ force: true });
    console.log('✓ Schema synced. Seeding...');

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    // ── 1. Demo User ──
    const passwordHash = await bcrypt.hash('demo1234', 10);
    const [user] = await User.upsert({
      email: 'demo@buzzstack.in',
      password_hash: passwordHash,
      full_name: 'Alex Creator',
      niche: 'Tech & Productivity',
      primary_platform: 'youtube'
    }, { returning: true });
    console.log('✓ Demo user');

    // ── 2. Brands ──
    const brandData = [
      { name: 'boAt', industry: 'Consumer Electronics', website: 'https://boat-lifestyle.com', contact_name: 'Priya Sharma', contact_email: 'priya@boat-lifestyle.com', warmth_score: 85, payment_reliability: 'excellent' },
      { name: 'Zerodha', industry: 'FinTech', website: 'https://zerodha.com', contact_name: 'Arjun Menon', contact_email: 'arjun@zerodha.com', warmth_score: 90, payment_reliability: 'excellent' },
      { name: 'Mamaearth', industry: 'D2C / Beauty', website: 'https://mamaearth.in', contact_name: 'Kavya Reddy', contact_email: 'kavya@mamaearth.in', warmth_score: 70, payment_reliability: 'good' },
      { name: 'Unacademy', industry: 'EdTech', website: 'https://unacademy.com', contact_name: 'Rahul Verma', contact_email: 'rahul@unacademy.com', warmth_score: 75, payment_reliability: 'good' },
      { name: 'Notion', industry: 'Productivity SaaS', website: 'https://notion.so', contact_name: 'Emily Davis', contact_email: 'emily@notion.so', warmth_score: 95, payment_reliability: 'excellent' },
      { name: 'Cred', industry: 'FinTech', website: 'https://cred.club', contact_name: 'Sneha Iyer', contact_email: 'sneha@cred.club', warmth_score: 80, payment_reliability: 'good' },
      { name: 'Lenskart', industry: 'Eyewear / D2C', website: 'https://lenskart.com', contact_name: 'Rohan Gupta', contact_email: 'rohan@lenskart.com', warmth_score: 65, payment_reliability: 'average' }
    ];
    const brands = [];
    for (const b of brandData) {
      brands.push(await Brand.create({ ...b, user_id: user.id }));
    }
    console.log('✓ 7 brands');

    // ── 3. Deals across every pipeline stage ──
    const dealsData = [
      { brand: brands[0], title: 'boAt Airdopes 500 Launch Campaign', total_value: 150000, stage: 'in_production', posting_deadline: new Date(now.getTime() + 14 * day), description: '2 YouTube vids + 3 Instagram reels for Airdopes 500 ANC launch.',
        deliverables: [
          { title: 'YouTube Unboxing & Review', type: 'youtube_video', platform: 'youtube', status: 'in_progress', deadline: new Date(now.getTime() + 10 * day) },
          { title: 'YouTube Comparison Shorts', type: 'youtube_video', platform: 'youtube', status: 'not_started', deadline: new Date(now.getTime() + 12 * day) },
          { title: 'Instagram Reels x3', type: 'instagram_reel', platform: 'instagram', status: 'not_started', deadline: new Date(now.getTime() + 13 * day) }
        ]},
      { brand: brands[1], title: 'Zerodha Varsity Integration', total_value: 200000, stage: 'posted', posting_deadline: new Date(now.getTime() - 5 * day), description: 'Sponsored integration in personal finance tutorial.', contract_signed_at: new Date(now.getTime() - 30 * day),
        deliverables: [
          { title: 'YouTube Finance Tutorial', type: 'youtube_video', platform: 'youtube', status: 'completed' }
        ]},
      { brand: brands[2], title: 'Mamaearth Vitamin C Range', total_value: 80000, stage: 'negotiation', posting_deadline: new Date(now.getTime() + 30 * day), description: 'Skincare routine featuring Vitamin C range.',
        deliverables: [
          { title: 'YouTube Skincare Routine', type: 'youtube_video', platform: 'youtube', status: 'not_started' },
          { title: 'Instagram Story Series', type: 'instagram_post', platform: 'instagram', status: 'not_started' }
        ]},
      { brand: brands[3], title: 'Unacademy Study-With-Me Series', total_value: 120000, stage: 'contract_sent', posting_deadline: new Date(now.getTime() + 21 * day), description: 'Study-with-me productivity video + app walkthrough.', contract_sent_at: new Date(now.getTime() - 3 * day),
        deliverables: [
          { title: 'YouTube Study-With-Me', type: 'youtube_video', platform: 'youtube', status: 'not_started' }
        ]},
      { brand: brands[4], title: 'Notion Creator OS Template', total_value: 250000, stage: 'paid', posting_deadline: new Date(now.getTime() - 20 * day), description: 'Full Notion workspace setup guide.', contract_signed_at: new Date(now.getTime() - 50 * day), invoice_sent_at: new Date(now.getTime() - 25 * day), payment_received_at: new Date(now.getTime() - 10 * day),
        deliverables: [
          { title: 'YouTube Notion Setup Guide', type: 'youtube_video', platform: 'youtube', status: 'completed' },
          { title: 'LinkedIn Write-up', type: 'blog_post', platform: 'linkedin', status: 'completed' }
        ]},
      { brand: brands[1], title: 'Zerodha Coin MF Campaign', total_value: 175000, stage: 'inbound', posting_deadline: new Date(now.getTime() + 45 * day), description: 'Mutual fund investing video — feature Zerodha Coin.', deliverables: [] },
      { brand: brands[0], title: 'boAt Rockerz 551 ANC Review', total_value: 180000, stage: 'qualified', posting_deadline: new Date(now.getTime() + 60 * day), description: 'Full headphone review + 30-day test.',
        deliverables: [
          { title: 'YouTube Review', type: 'youtube_video', platform: 'youtube', status: 'not_started' },
          { title: 'Instagram Reel', type: 'instagram_reel', platform: 'instagram', status: 'not_started' }
        ]},
      { brand: brands[5], title: 'Cred Holiday Cashback Promo', total_value: 100000, stage: 'invoice_sent', posting_deadline: new Date(now.getTime() - 7 * day), description: 'Holiday cashback integration.', contract_signed_at: new Date(now.getTime() - 40 * day), invoice_sent_at: new Date(now.getTime() - 10 * day),
        deliverables: [
          { title: 'YouTube Integration', type: 'youtube_video', platform: 'youtube', status: 'completed' }
        ]},
      { brand: brands[6], title: 'Lenskart Blue-Light Glasses Collab', total_value: 60000, stage: 'negotiation', posting_deadline: new Date(now.getTime() + 35 * day), description: 'Blue-light glasses for desk setup angle.',
        deliverables: [
          { title: 'YouTube Desk Setup Integration', type: 'youtube_video', platform: 'youtube', status: 'not_started' }
        ]},
      { brand: brands[5], title: 'Cred UPI Rewards Feature', total_value: 130000, stage: 'contract_sent', posting_deadline: new Date(now.getTime() + 25 * day), description: 'UPI rewards walkthrough.', contract_sent_at: new Date(now.getTime() - 2 * day),
        deliverables: [
          { title: 'YouTube Walkthrough', type: 'youtube_video', platform: 'youtube', status: 'not_started' },
          { title: 'Twitter Thread', type: 'twitter_post', platform: 'twitter', status: 'not_started' }
        ]}
    ];
    const deals = [];
    for (const d of dealsData) {
      const { brand, deliverables: dList, ...fields } = d;
      const deal = await Deal.create({ ...fields, user_id: user.id, brand_id: brand.id });
      deals.push(deal);
      for (const dl of dList) await Deliverable.create({ ...dl, deal_id: deal.id });
    }
    console.log('✓ 10 deals + deliverables');

    // Brand aggregate stats
    await Brand.update({ total_deals: 2, total_revenue: 150000, average_deal_value: 165000, last_collaboration_date: now }, { where: { id: brands[0].id } });
    await Brand.update({ total_deals: 2, total_revenue: 200000, average_deal_value: 187500, last_collaboration_date: now }, { where: { id: brands[1].id } });
    await Brand.update({ total_deals: 1, total_revenue: 0, average_deal_value: 80000 }, { where: { id: brands[2].id } });
    await Brand.update({ total_deals: 1, total_revenue: 0, average_deal_value: 120000 }, { where: { id: brands[3].id } });
    await Brand.update({ total_deals: 1, total_revenue: 250000, average_deal_value: 250000, last_collaboration_date: now }, { where: { id: brands[4].id } });
    await Brand.update({ total_deals: 2, total_revenue: 100000, average_deal_value: 115000, last_collaboration_date: now }, { where: { id: brands[5].id } });
    await Brand.update({ total_deals: 1, total_revenue: 0, average_deal_value: 60000 }, { where: { id: brands[6].id } });

    // ── 4. Revenue Entries (18 entries, 6 months) ──
    const rev = [
      { source_type: 'sponsorship', source_name: 'Notion', amount: 250000, date: new Date(now.getFullYear(), now.getMonth() - 5, 15), platform: 'youtube', brand_id: brands[4].id, deal_id: deals[4].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 18500, date: new Date(now.getFullYear(), now.getMonth() - 5, 28), platform: 'youtube' },
      { source_type: 'affiliate', source_name: 'Amazon Associates', amount: 4200, date: new Date(now.getFullYear(), now.getMonth() - 5, 20), platform: 'youtube' },
      { source_type: 'sponsorship', source_name: 'Cred', amount: 100000, date: new Date(now.getFullYear(), now.getMonth() - 4, 10), platform: 'youtube', brand_id: brands[5].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 21000, date: new Date(now.getFullYear(), now.getMonth() - 4, 28), platform: 'youtube' },
      { source_type: 'affiliate', source_name: 'Amazon Associates', amount: 5100, date: new Date(now.getFullYear(), now.getMonth() - 4, 20), platform: 'youtube' },
      { source_type: 'sponsorship', source_name: 'Zerodha', amount: 200000, date: new Date(now.getFullYear(), now.getMonth() - 3, 5), platform: 'youtube', brand_id: brands[1].id, deal_id: deals[1].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 24500, date: new Date(now.getFullYear(), now.getMonth() - 3, 28), platform: 'youtube' },
      { source_type: 'membership', source_name: 'Channel Memberships', amount: 12000, date: new Date(now.getFullYear(), now.getMonth() - 3, 15), platform: 'youtube' },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 26800, date: new Date(now.getFullYear(), now.getMonth() - 2, 28), platform: 'youtube' },
      { source_type: 'affiliate', source_name: 'Amazon Associates', amount: 7300, date: new Date(now.getFullYear(), now.getMonth() - 2, 20), platform: 'youtube' },
      { source_type: 'membership', source_name: 'Channel Memberships', amount: 14200, date: new Date(now.getFullYear(), now.getMonth() - 2, 15), platform: 'youtube' },
      { source_type: 'merchandise', source_name: 'Merch Store', amount: 8500, date: new Date(now.getFullYear(), now.getMonth() - 2, 10), platform: 'other' },
      { source_type: 'sponsorship', source_name: 'boAt', amount: 150000, date: new Date(now.getFullYear(), now.getMonth() - 1, 8), platform: 'youtube', brand_id: brands[0].id },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 28900, date: new Date(now.getFullYear(), now.getMonth() - 1, 28), platform: 'youtube' },
      { source_type: 'membership', source_name: 'Channel Memberships', amount: 15800, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), platform: 'youtube' },
      { source_type: 'adsense', source_name: 'YouTube AdSense', amount: 14200, date: new Date(now.getFullYear(), now.getMonth(), 15), platform: 'youtube' },
      { source_type: 'affiliate', source_name: 'Amazon Associates', amount: 3800, date: new Date(now.getFullYear(), now.getMonth(), 10), platform: 'youtube' }
    ];
    for (const r of rev) await RevenueEntry.create({ ...r, user_id: user.id });
    console.log('✓ 18 revenue entries');

    // ── 5. Invoices ──
    const invs = [
      { deal_id: deals[4].id, invoice_number: 'INV-2025-001', amount: 250000, currency: 'INR', status: 'paid', due_date: new Date(now.getFullYear(), now.getMonth() - 5, 30), sent_at: new Date(now.getFullYear(), now.getMonth() - 5, 20), paid_at: new Date(now.getFullYear(), now.getMonth() - 5, 28), notes: 'Paid on time' },
      { deal_id: deals[7].id, invoice_number: 'INV-2025-002', amount: 100000, currency: 'INR', status: 'overdue', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), sent_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12), notes: 'Net 7 — follow up' },
      { deal_id: deals[0].id, invoice_number: 'INV-2025-003', amount: 150000, currency: 'INR', status: 'draft', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20), notes: 'Send on delivery' },
      { deal_id: deals[1].id, invoice_number: 'INV-2025-004', amount: 200000, currency: 'INR', status: 'sent', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10), sent_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4), notes: 'Net 15' },
      { deal_id: deals[3].id, invoice_number: 'INV-2025-005', amount: 120000, currency: 'INR', status: 'draft', due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30), notes: 'Pending contract' }
    ];
    for (const inv of invs) await Invoice.create({ ...inv, user_id: user.id });
    console.log('✓ 5 invoices');

    // ── 6. Content Posts (8 — for CreatorAI style analysis) ──
    const posts = [
      { title: 'My Entire Productivity System in 2025', body: 'Full breakdown of apps, workflows, and habits.', youtube_description: 'My complete productivity system for 2025.\n\n⏱ Timestamps:\n0:00 Intro\n1:20 Morning routine\n3:45 Notion setup\n7:00 Calendar blocking', youtube_tags: 'productivity,notion,creator workflow,2025', instagram_caption: '🚀 My entire productivity stack for 2025 — swipe for the breakdown!\n\nSave this 🔖', linkedin_text: 'Rebuilt my workflow from scratch. Here\'s what stuck.', twitter_text: 'My 2025 productivity stack 🧵👇', status: 'published', scheduled_at: new Date(now.getTime() - 60 * day) },
      { title: 'boAt Airdopes 500 — Honest 30-Day Review', body: '30-day review of boAt Airdopes 500 ANC.', youtube_description: 'After 30 days with boAt Airdopes 500, here\'s my honest take.\n\n⏱ 0:00 First impressions\n2:30 Sound\n5:00 ANC\n8:00 Battery', youtube_tags: 'boAt,Airdopes 500,TWS,earbuds,ANC', instagram_caption: '🎧 30 days with boAt Airdopes 500:\nANC: ✅ Great\nBattery: ✅ 2 days\nCalls: ⚠️ Average', linkedin_text: 'Honest reviews drive real purchase decisions in the creator economy.', twitter_text: '30-day review of @boAtLifestyle Airdopes 500 🎧 Full vid up!', status: 'published', scheduled_at: new Date(now.getTime() - 45 * day), deal_id: deals[0].id },
      { title: 'How I Manage Money as a Creator (Zerodha)', body: 'Personal finance for creators using Zerodha.', youtube_description: 'Creators don\'t get a salary slip — here\'s my system.\n\n⏱ 0:00 Chaotic income\n2:00 Savings split\n4:30 Zerodha Coin\n7:00 Tax planning', youtube_tags: 'personal finance,zerodha,creator income,investing', instagram_caption: '💰 My money split:\n50% → Business\n30% → Investments\n20% → Personal\n\nSave this 🔖', linkedin_text: 'The creator economy has a financial literacy gap. Here\'s my system.', twitter_text: 'Creators — stop ignoring your finances. My exact system 🧵', status: 'published', scheduled_at: new Date(now.getTime() - 30 * day), deal_id: deals[1].id },
      { title: 'Notion Creator OS — Free Template', body: 'Free Notion template for creators: CRM, calendar, revenue tracker.', youtube_description: 'Free Notion template for creators.\n\n⏱ 0:00 Why I built this\n1:30 Dashboard\n4:00 CRM\n6:30 Calendar\n9:00 Revenue', youtube_tags: 'notion,template,creator tools,CRM', instagram_caption: '📋 FREE Notion template!\n• Brand CRM\n• Content calendar\n• Revenue tracker\nLink in bio!', linkedin_text: 'Open-sourced my Notion workspace for creators.', twitter_text: 'Free Notion template for creators 🎁 Link in bio!', status: 'published', scheduled_at: new Date(now.getTime() - 20 * day), deal_id: deals[4].id },
      { title: 'Desk Setup Tour 2025', body: 'Camera, mic, lighting, desk, chair — everything for filming.', youtube_description: '2025 desk setup! Everything I use.\n\n⏱ 0:00 Room\n1:30 Camera\n3:00 Audio\n5:00 Lighting\n7:00 Desk', youtube_tags: 'desk setup,creator setup,WFH,2025', instagram_caption: '🖥 2025 setup tour!\nCamera: Sony A7IV\nMic: Rode NT1\nDesk: IKEA Bekant', linkedin_text: 'Your workspace impacts output quality. My 2025 setup.', twitter_text: '2025 desk setup tour is live! 🖥', status: 'published', scheduled_at: new Date(now.getTime() - 10 * day) },
      { title: 'Is Cred Actually Worth It?', body: '3-month test of Cred cashback and rewards.', youtube_description: 'Used Cred for 3 months. Worth it?\n\n⏱ 0:00 The hype\n2:00 Cashback\n4:30 UPI\n6:00 Verdict', youtube_tags: 'cred,cashback,UPI,fintech', instagram_caption: '💳 3 months with Cred:\n✅ ₹2,400 cashback\n✅ UPI rewards\n⚠️ Not all offers great', linkedin_text: 'Tested Cred for 3 months. Gamification is brilliant.', twitter_text: 'Used @CRED_club for 3 months. Earned ₹2,400 cashback 👇', status: 'published', scheduled_at: new Date(now.getTime() - 5 * day), deal_id: deals[7].id },
      { title: '5 AI Tools Every Creator Should Use in 2025', body: 'AI tools for scripting, editing, thumbnails, captions, SEO.', youtube_description: '5 AI tools that save me hours weekly.\n\n⏱ 0:00 Why AI\n1:30 Scripting\n3:30 Editing\n5:30 Thumbnails', youtube_tags: 'AI tools,creator tools,productivity,2025', instagram_caption: '🤖 5 AI tools for creators:\n1. ChatGPT\n2. Descript\n3. Midjourney\n4. Opus Clip\n5. VidIQ', linkedin_text: 'AI cut my production time by 40%. These 5 tools.', twitter_text: '5 AI tools saving me 10+ hrs/week as a creator 🧵', status: 'draft', scheduled_at: new Date(now.getTime() + 3 * day) },
      { title: 'Mamaearth Vitamin C — 4 Week Test', body: '4-week test of Mamaearth Vitamin C serum.', youtube_description: '4 weeks with Mamaearth Vitamin C.\n\n⏱ 0:00 Setup\n1:30 Week 1\n3:00 Week 2\n4:30 Results', youtube_tags: 'mamaearth,vitamin c,skincare,honest review', instagram_caption: '🧴 4 weeks Mamaearth Vitamin C:\nWeek 1: No change\nWeek 2: Slight glow\nWeek 3-4: Brightness!', linkedin_text: 'D2C beauty in India — product quality is improving.', twitter_text: '4 weeks with Mamaearth Vitamin C. Verdict: works for ₹599!', status: 'draft', scheduled_at: new Date(now.getTime() + 7 * day), deal_id: deals[2].id }
    ];
    for (const p of posts) await ContentPost.create({ ...p, user_id: user.id });
    console.log('✓ 8 content posts');

    // ── 7. Negotiation Notes ──
    const notes = [
      { brand_id: brands[0].id, deal_id: deals[0].id, note_type: 'budget_range', content: 'boAt offers ₹1L–₹2L for YouTube integrations. Push for 3 deliverables min.', metadata: JSON.stringify({ min: 100000, max: 200000 }) },
      { brand_id: brands[0].id, deal_id: deals[0].id, note_type: 'payment_terms', content: 'boAt pays Net 30 after content goes live via NEFT.', metadata: JSON.stringify({ terms: 'Net 30' }) },
      { brand_id: brands[1].id, deal_id: deals[1].id, note_type: 'rate_card', content: 'Zerodha pays premium for finance creators. Got ₹2L for single integration.', metadata: JSON.stringify({ rate: 200000 }) },
      { brand_id: brands[2].id, deal_id: deals[2].id, note_type: 'discount', content: 'Mamaearth lowballed at ₹40K. Countered at ₹80K with 2 deliverables. Agreed.', metadata: JSON.stringify({ initial: 40000, final: 80000 }) },
      { brand_id: brands[2].id, deal_id: deals[2].id, note_type: 'revision_demand', content: '1 round of script approval before filming. Usually 2-day turnaround.', metadata: JSON.stringify({ rounds: 1 }) },
      { brand_id: brands[4].id, deal_id: deals[4].id, note_type: 'general', content: 'Notion = dream client. Creative freedom, fast payments, long-term potential. Always yes.' },
      { brand_id: brands[5].id, deal_id: deals[7].id, note_type: 'budget_range', content: 'Cred offers ₹80K–₹1.5L depending on campaign. Holiday promos pay more.', metadata: JSON.stringify({ min: 80000, max: 150000 }) },
      { brand_id: brands[6].id, deal_id: deals[8].id, note_type: 'payment_terms', content: 'Lenskart pays Net 45 — slow but reliable. Push for Net 30.', metadata: JSON.stringify({ terms: 'Net 45' }) },
      { brand_id: brands[1].id, deal_id: deals[5].id, note_type: 'general', content: 'Zerodha team super responsive. Arjun replies within hours. Build long-term.' },
      { brand_id: brands[3].id, deal_id: deals[3].id, note_type: 'budget_range', content: 'Unacademy allocates ₹1L–₹1.5L for tech/edu creators. Value audience quality.', metadata: JSON.stringify({ min: 100000, max: 150000 }) }
    ];
    for (const n of notes) await NegotiationNote.create({ ...n, user_id: user.id });
    console.log('✓ 10 negotiation notes');

    // ── 8. Team Members ──
    const teamData = [
      { name: 'Vikram Singh', email: 'vikram@gmail.com', role: 'Video Editor', status: 'active' },
      { name: 'Sneha Patil', email: 'sneha.p@gmail.com', role: 'Thumbnail Designer', status: 'active' },
      { name: 'Ananya Joshi', email: 'ananya.j@gmail.com', role: 'Content Writer', status: 'active' },
      { name: 'Karthik R', email: 'karthik.r@gmail.com', role: 'Scriptwriter', status: 'active' },
      { name: 'Divya Nair', email: 'divya.n@gmail.com', role: 'Social Media Manager', status: 'active' },
      { name: 'Ravi Kumar', email: 'ravi.k@gmail.com', role: 'Video Editor', status: 'inactive' }
    ];
    const members = [];
    for (const t of teamData) members.push(await TeamMember.create({ ...t, user_id: user.id }));
    console.log('✓ 6 team members');

    // ── 9. Tickets (12 across all statuses) ──
    const fmt = d => d.toISOString().split('T')[0];
    const tix = [
      { title: 'Edit boAt Airdopes review video', description: 'Full edit: jump cuts, b-roll, color grading. Raw in Drive.', category: 'Editing', priority: 'high', assigned_to: members[0].id, status: 'in_progress', due_date: fmt(new Date(now.getTime() + 5 * day)), deal_id: deals[0].id },
      { title: 'Create thumbnail for boAt review', description: 'Split comparison style. Product left, reaction right.', category: 'Thumbnail', priority: 'high', assigned_to: members[1].id, status: 'todo', due_date: fmt(new Date(now.getTime() + 6 * day)), deal_id: deals[0].id },
      { title: 'Write Unacademy study-with-me script', description: 'Conversational tone. App walkthrough segment. 10-12 min.', category: 'Script', priority: 'medium', assigned_to: members[3].id, status: 'in_progress', due_date: fmt(new Date(now.getTime() + 8 * day)), deal_id: deals[3].id },
      { title: 'Design Instagram carousel for Notion', description: '5 slides: cover + 4 features. Notion colors + teal accent.', category: 'Graphic Design', priority: 'medium', assigned_to: members[1].id, status: 'review', due_date: fmt(new Date(now.getTime() + 2 * day)), deal_id: deals[4].id },
      { title: 'Write captions for boAt Instagram reels', description: '3 reel captions — casual, trendy. CTAs + hashtags.', category: 'Caption', priority: 'medium', assigned_to: members[2].id, status: 'todo', due_date: fmt(new Date(now.getTime() + 10 * day)), deal_id: deals[0].id },
      { title: 'Schedule Zerodha posts across platforms', description: 'YouTube done. Schedule LinkedIn + Twitter.', category: 'Scheduling', priority: 'low', assigned_to: members[4].id, status: 'done', due_date: fmt(new Date(now.getTime() - 3 * day)), deal_id: deals[1].id },
      { title: 'Research trending desk setup videos', description: 'Top 10 desk setup vids last month. Note hooks, thumbnails.', category: 'Research', priority: 'low', assigned_to: members[2].id, status: 'done', due_date: fmt(new Date(now.getTime() - 5 * day)) },
      { title: 'Edit Cred review — cashback overlays', description: 'Screen recordings of cashback. Green/black scheme.', category: 'Editing', priority: 'medium', assigned_to: members[0].id, status: 'done', due_date: fmt(new Date(now.getTime() - 2 * day)), deal_id: deals[7].id },
      { title: 'Draft Mamaearth script — before/after', description: 'Week-by-week format. Brand approval before filming.', category: 'Script', priority: 'high', assigned_to: members[3].id, status: 'todo', due_date: fmt(new Date(now.getTime() + 15 * day)), deal_id: deals[2].id },
      { title: 'Create YouTube shorts from Notion video', description: '3 clips < 60s from full video. Add captions.', category: 'Editing', priority: 'low', assigned_to: members[0].id, status: 'review', due_date: fmt(new Date(now.getTime() + 1 * day)), deal_id: deals[4].id },
      { title: 'Reply to Lenskart — counter offer', description: 'They sent initial offer. Draft counter-offer email.', category: 'Admin', priority: 'urgent', assigned_to: null, status: 'todo', due_date: fmt(new Date(now.getTime() + 1 * day)), deal_id: deals[8].id },
      { title: 'Follow up on Cred overdue invoice', description: 'INV-2025-002 overdue 5 days. Send polite follow-up.', category: 'Admin', priority: 'urgent', assigned_to: null, status: 'todo', due_date: fmt(now), deal_id: deals[7].id }
    ];
    for (const t of tix) await Ticket.create({ ...t, user_id: user.id });
    console.log('✓ 12 tickets');

    console.log('\n✅ Seed complete!');
    console.log('   Login: demo@buzzstack.in / demo1234');
    console.log('   7 brands · 10 deals · 18 revenue · 5 invoices');
    console.log('   8 posts · 10 notes · 6 team · 12 tickets');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
