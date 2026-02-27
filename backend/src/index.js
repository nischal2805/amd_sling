require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/brands', apiLimiter, require('./middleware/auth'), require('./routes/brands'));
app.use('/api/deals', apiLimiter, require('./middleware/auth'), require('./routes/deals'));
app.use('/api/deliverables', apiLimiter, require('./middleware/auth'), require('./routes/deliverables'));
app.use('/api/revenue', apiLimiter, require('./middleware/auth'), require('./routes/revenue'));
app.use('/api/invoices', apiLimiter, require('./middleware/auth'), require('./routes/invoices'));
app.use('/api/analytics', apiLimiter, require('./middleware/auth'), require('./routes/analytics'));
app.use('/api/ai', apiLimiter, require('./middleware/auth'), require('./routes/ai'));
app.use('/api/gmail', apiLimiter, require('./routes/gmail')); // gmail has its own auth handling

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
