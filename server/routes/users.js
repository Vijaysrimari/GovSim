const router = require('express').Router();
const auth = require('../middleware/auth');
const { User } = require('../models/User');
const Policy = require('../models/Policy');
const SimulationRun = require('../models/SimulationRun');
const mongoose = require('mongoose');
const seedData = require('../data/seed');

const isDbConnected = () => mongoose.connection.readyState === 1;

const getDevProfileStore = (req) => {
  if (!req.app.locals.devProfiles) req.app.locals.devProfiles = new Map();
  return req.app.locals.devProfiles;
};

const getDevProfile = (req, userId) => {
  const store = getDevProfileStore(req);
  if (!store.has(String(userId))) {
    store.set(String(userId), { savedPolicyIds: [], savedSimulations: [] });
  }
  return store.get(String(userId));
};

const findOfflinePolicy = (req, policyId) => {
  const tempPolicies = Array.from(req.app.locals.tempPolicies || []);
  return tempPolicies.find((policy) => String(policy._id) === String(policyId))
    || (seedData.POLICIES_DATA || []).find((policy) => String(policy._id) === String(policyId))
    || null;
};

const serializePolicy = (policy) => {
  if (!policy) return null;
  return {
    ...policy,
    _id: policy._id,
    impactData: policy.impactData,
    title: policy.title,
    category: policy.category,
    subtitle: policy.subtitle,
    icon: policy.icon,
    duration: policy.duration,
    netScore: policy.netScore
  };
};

const serializeSimulationRun = (run, policy) => ({
  _id: run._id,
  userId: run.userId,
  policyId: policy ? {
    _id: policy._id,
    title: policy.title,
    category: policy.category,
    icon: policy.icon
  } : run.policyId,
  month: run.month,
  notes: run.notes || '',
  snapshot: run.snapshot || {},
  createdAt: run.createdAt || new Date().toISOString(),
  updatedAt: run.updatedAt || run.createdAt || new Date().toISOString()
});

router.get('/profile', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const profile = getDevProfile(req, req.user._id);
      const savedPolicies = profile.savedPolicyIds
        .map((policyId) => findOfflinePolicy(req, policyId))
        .filter(Boolean)
        .map((policy) => serializePolicy(policy));
      const savedSimulations = profile.savedSimulations
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 30)
        .map((run) => serializeSimulationRun(run, findOfflinePolicy(req, run.policyId)));

      return res.json({
        user: { _id: req.user._id, name: 'GovSim Admin', email: 'admin@govsim.in', role: 'admin' },
        savedPolicies,
        savedSimulations
      });
    }

    const [user, runs] = await Promise.all([
      User.findById(req.user._id)
        .select('-password')
        .populate('savedPolicies', 'title category subtitle icon duration netScore'),
      SimulationRun.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('policyId', 'title category icon')
    ]);

    res.json({
      user,
      savedPolicies: user?.savedPolicies || [],
      savedSimulations: runs
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/saved-policies/:policyId', auth, async (req, res) => {
  try {
    const { policyId } = req.params;
    if (!isDbConnected()) {
      const localPolicy = findOfflinePolicy(req, policyId);
      if (!localPolicy) return res.status(404).json({ message: 'Policy not found' });

      const profile = getDevProfile(req, req.user._id);
      const already = profile.savedPolicyIds.some((id) => String(id) === String(policyId));

      if (already) {
        profile.savedPolicyIds = profile.savedPolicyIds.filter((id) => String(id) !== String(policyId));
      } else {
        profile.savedPolicyIds.push(String(policyId));
      }

      return res.json({ saved: !already, savedPolicies: profile.savedPolicyIds.map((id) => findOfflinePolicy(req, id)).filter(Boolean).map(serializePolicy) });
    }

    if (!mongoose.Types.ObjectId.isValid(policyId)) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const exists = await Policy.exists({ _id: policyId });
    if (!exists) return res.status(404).json({ message: 'Policy not found' });

    const user = await User.findById(req.user._id);
    const already = user.savedPolicies.some((id) => String(id) === String(policyId));

    if (already) {
      user.savedPolicies = user.savedPolicies.filter((id) => String(id) !== String(policyId));
    } else {
      user.savedPolicies.push(policyId);
    }

    await user.save();
    res.json({ saved: !already, savedPolicies: user.savedPolicies });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/saved-simulations', auth, async (req, res) => {
  try {
    const { policyId, month = 0, notes = '', snapshot = {} } = req.body;
    if (!isDbConnected()) {
      const localPolicy = findOfflinePolicy(req, policyId);
      if (!localPolicy) return res.status(404).json({ message: 'Policy not found' });

      const profile = getDevProfile(req, req.user._id);
      const run = {
        _id: `dev-run-${Date.now()}`,
        userId: String(req.user._id),
        policyId: String(policyId),
        month,
        notes,
        snapshot,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      profile.savedSimulations = [run, ...profile.savedSimulations].slice(0, 100);
      return res.status(201).json(serializeSimulationRun(run, localPolicy));
    }

    if (!mongoose.Types.ObjectId.isValid(policyId)) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const exists = await Policy.exists({ _id: policyId });
    if (!exists) return res.status(404).json({ message: 'Policy not found' });

    const run = await SimulationRun.create({
      userId: req.user._id,
      policyId,
      month,
      notes,
      snapshot
    });

    const populated = await SimulationRun.findById(run._id).populate('policyId', 'title category icon');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/saved-simulations', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const profile = getDevProfile(req, req.user._id);
      const runs = profile.savedSimulations
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map((run) => serializeSimulationRun(run, findOfflinePolicy(req, run.policyId)));
      return res.json(runs);
    }

    const runs = await SimulationRun.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('policyId', 'title category icon');
    res.json(runs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
