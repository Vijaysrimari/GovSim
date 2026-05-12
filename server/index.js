require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ensureSeeded } = require('./data/seed');

const app = express();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/simulations', require('./routes/simulations'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));

// Health
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/govsim';

(async () => {
  let connected = false;
  try {
    await mongoose.connect(MONGO_URI);
    connected = true;
    console.log('✅ MongoDB connected');
    const seeded = await ensureSeeded();
    if (seeded) console.log('🌱 Seed data created');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message || err);
    console.warn('⚠️  Continuing without database connection — running in degraded mode');
  }

  // expose DB status to routes if needed
  app.set('db_connected', connected);

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (db_connected=${connected})`));
})();
