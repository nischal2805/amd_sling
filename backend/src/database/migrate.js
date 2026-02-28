require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  await client.connect();
  console.log('Connected to database, running migrations...');

  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Migration 1: users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        niche VARCHAR(100),
        primary_platform VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('✓ users table');

    // Migration 2: brands
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        industry VARCHAR(100),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        total_deals INTEGER DEFAULT 0,
        total_revenue DECIMAL(10, 2) DEFAULT 0,
        average_deal_value DECIMAL(10, 2),
        average_payment_days INTEGER,
        payment_reliability VARCHAR(20) DEFAULT 'unknown',
        warmth_score INTEGER DEFAULT 50,
        last_collaboration_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_brands_user ON brands(user_id)');
    console.log('✓ brands table');

    // Migration 3: deals
    await client.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        brand_id UUID REFERENCES brands(id),
        title VARCHAR(255) NOT NULL,
        total_value DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'USD',
        stage VARCHAR(50) DEFAULT 'inbound',
        description TEXT,
        posting_deadline DATE,
        start_date DATE,
        end_date DATE,
        email_thread_id VARCHAR(255),
        contract_sent_at TIMESTAMP,
        contract_signed_at TIMESTAMP,
        invoice_sent_at TIMESTAMP,
        payment_received_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_deals_user ON deals(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_deals_brand ON deals(brand_id)');
    console.log('✓ deals table');

    // Migration 4: deliverables
    await client.query(`
      CREATE TABLE IF NOT EXISTS deliverables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        platform VARCHAR(50),
        status VARCHAR(50) DEFAULT 'not_started',
        deadline DATE,
        requirements TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_deliverables_deal ON deliverables(deal_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status)');
    console.log('✓ deliverables table');

    // Migration 5: revenue_entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        source_type VARCHAR(50) NOT NULL,
        source_name VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        date DATE NOT NULL,
        platform VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_revenue_user_date ON revenue_entries(user_id, date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_revenue_source ON revenue_entries(source_type)');
    console.log('✓ revenue_entries table');

    // Migration 6: invoices
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'draft',
        due_date DATE,
        sent_at TIMESTAMP,
        paid_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_deal ON invoices(deal_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
    console.log('✓ invoices table');

    // Migration 7: platform_connections
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        platform_user_id VARCHAR(255),
        platform_username VARCHAR(255),
        platform_email VARCHAR(255),
        instagram_user_id VARCHAR(255),
        additional_data JSONB,
        is_active BOOLEAN DEFAULT true,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, platform)
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_connections_user ON platform_connections(user_id)');
    console.log('✓ platform_connections table');

    // Migration 8: content_posts
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
        title VARCHAR(500),
        body TEXT,
        media_url TEXT,
        media_type VARCHAR(20),
        youtube_title VARCHAR(500),
        youtube_description TEXT,
        youtube_tags VARCHAR(500),
        youtube_category_id VARCHAR(10) DEFAULT '22',
        youtube_privacy VARCHAR(20) DEFAULT 'public',
        instagram_caption TEXT,
        linkedin_text TEXT,
        twitter_text VARCHAR(280),
        status VARCHAR(20) DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        youtube_video_id VARCHAR(255),
        instagram_media_id VARCHAR(255),
        linkedin_post_id VARCHAR(255),
        twitter_tweet_id VARCHAR(255),
        publish_error TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_user ON content_posts(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_status ON content_posts(status)');
    console.log('✓ content_posts table');

    // Migration 9: post_platforms
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_platforms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        platform_post_id VARCHAR(255),
        published_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, platform)
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_post_platforms_post ON post_platforms(post_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_post_platforms_status ON post_platforms(status)');
    console.log('✓ post_platforms table');

    // Migration 10: ai_interactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50),
        input_summary TEXT,
        output_text TEXT,
        deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_user ON ai_interactions(user_id, created_at)');
    console.log('✓ ai_interactions table');

    await client.query('COMMIT');
    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await client.end();
  }
}

runMigrations().catch(err => {
  console.error(err);
  process.exit(1);
});
