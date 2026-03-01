require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brands');
const dealRoutes = require('./routes/deals');
const revenueRoutes = require('./routes/revenue');
const invoiceRoutes = require('./routes/invoices');
const analyticsRoutes = require('./routes/analytics');
const gmailRoutes = require('./routes/gmail');
const connectionRoutes = require('./routes/connections');
const postRoutes = require('./routes/posts');
const aiRoutes = require('./routes/ai');
const negotiationRoutes = require('./routes/negotiations');
const teamRoutes = require('./routes/team');
const ticketRoutes = require('./routes/tickets');

const { sequelize } = require('./models');
const { startScheduler } = require('./jobs/publishScheduler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/tickets', ticketRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    // Auto-create tables if they don't exist (especially useful for SQLite)
    await sequelize.sync();
    console.log('Database tables synced');
    startScheduler();
    app.listen(PORT, () => {
      console.log(`BuzzStack backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
