const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const mongoose = require('mongoose');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'govsim_secret_2024', { expiresIn: '7d' });

const isDbConnected = () => mongoose.connection.readyState === 1;

const getDevUserStore = (req) => {
  if (!req.app.locals.devAuthUsers) {
    req.app.locals.devAuthUsers = new Map([
      ['admin@govsim.in', {
        id: 'dev-admin',
        name: 'GovSim Admin',
        email: 'admin@govsim.in',
        password: 'password123',
        role: 'admin'
      }]
    ]);
  }
  return req.app.locals.devAuthUsers;
};

const serializeUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!isDbConnected()) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      if (!cleanName || !cleanEmail || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      const devUsers = getDevUserStore(req);
      if (devUsers.has(cleanEmail)) return res.status(400).json({ message: 'Email already registered' });

      const user = {
        id: `dev-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password,
        role: 'analyst'
      };

      devUsers.set(cleanEmail, user);
      return res.status(201).json({ token: sign(user.id), user: serializeUser(user) });
    }

    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: sign(user._id), user: serializeUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isDbConnected()) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const devUser = getDevUserStore(req).get(cleanEmail);
      if (!devUser || devUser.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return res.json({ token: sign(devUser.id), user: serializeUser(devUser) });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: sign(user._id), user: serializeUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json(req.user);
});

module.exports = router;
