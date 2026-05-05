const router = require('express').Router();
const Policy = require('../models/Policy');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const seedData = require('../data/seed');

const CATEGORY_SCENE = {
  Education: 'digital_classroom',
  Healthcare: 'universal_health',
  Environment: 'solar_rooftop',
  Economic: 'startup_india',
  Infrastructure: 'smart_city',
  Social: 'pension_scheme',
  Agriculture: 'e_nam'
};

const getDeletedPolicyIds = (req) => {
  if (!req.app.locals.deletedPolicyIds) req.app.locals.deletedPolicyIds = new Set();
  return req.app.locals.deletedPolicyIds;
};

const isDeletedPolicy = (req, policyId) => getDeletedPolicyIds(req).has(String(policyId));

const filterOutDeletedPolicies = (req, policies) => policies.filter((policy) => !isDeletedPolicy(req, policy._id));

router.get('/', async (req, res) => {
  try {
    const { category, status, search, ids, page = 1, limit = 20 } = req.query;
    const dbConnected = mongoose.connection.readyState === 1;

    // If DB is not connected, return fallback data (seed + in-memory temp policies)
    if (!dbConnected) {
      const list = Array.from(req.app.locals.tempPolicies || []);
      const seedList = seedData.POLICIES_DATA || [];
      let combined = filterOutDeletedPolicies(req, [...list, ...seedList]);
      if (category) combined = combined.filter(p => p.category === category);
      if (search) combined = combined.filter(p => String(p.title).toLowerCase().includes(String(search).toLowerCase()));
      if (ids) {
        const idList = String(ids).split(',').map(v => v.trim()).filter(Boolean);
        combined = combined.filter(p => idList.includes(String(p._id)));
      }
      const total = combined.length;
      const pages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const policies = combined.slice(start, start + Number(limit)).map(p => {
        const copy = { ...p };
        delete copy.impactData;
        return copy;
      });
      return res.json({ policies, total, pages });
    }

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (ids) {
      const list = String(ids).split(',').map((v) => v.trim()).filter(Boolean);
      if (list.length) query._id = { $in: list };
    }
    const policies = await Policy.find(query)
      .select('-impactData')
      .limit(limit * 1).skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Policy.countDocuments(query);
    res.json({ policies, total, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      if (isDeletedPolicy(req, req.params.id)) {
        return res.status(404).json({ message: 'Policy not found' });
      }
      const local = (req.app.locals.tempPolicies || []).find(p => String(p._id) === String(req.params.id)) || (seedData.POLICIES_DATA || []).find(p => String(p._id) === String(req.params.id));
      if (!local) return res.status(404).json({ message: 'Policy not found' });
      return res.json(local);
    }

    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id/simulation', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      if (isDeletedPolicy(req, req.params.id)) {
        return res.status(404).json({ message: 'Policy not found' });
      }
      const local = (req.app.locals.tempPolicies || []).find(p => String(p._id) === String(req.params.id)) || (seedData.POLICIES_DATA || []).find(p => String(p._id) === String(req.params.id));
      if (!local) return res.status(404).json({ message: 'Policy not found' });
      const pick = (({ impactData, phases, title, category, icon, sceneType, positiveImpacts, negativeImpacts, netScore, _id }) => ({ impactData, phases, title, category, icon, sceneType, positiveImpacts, negativeImpacts, netScore, _id }))(local);
      return res.json(pick);
    }

    const policy = await Policy.findById(req.params.id).select('impactData phases title category icon sceneType positiveImpacts negativeImpacts netScore');
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };

    if (!payload.phases || !payload.phases.length) {
      const duration = Number(payload.duration || 48);
      const q = Math.max(1, Math.floor(duration / 4));
      payload.phases = [
        { phase: 0, name: 'Setup', monthStart: 0, monthEnd: q - 1, description: 'Policy setup and onboarding', color: '#eab308' },
        { phase: 1, name: 'Positive Wave', monthStart: q, monthEnd: q * 2 - 1, description: 'Early positive adoption', color: '#22c55e' },
        { phase: 2, name: 'Negative Emergence', monthStart: q * 2, monthEnd: q * 3 - 1, description: 'Operational side-effects emerge', color: '#ef4444' },
        { phase: 3, name: 'Equilibrium', monthStart: q * 3, monthEnd: duration, description: 'Policy stabilization and controls', color: '#3b82f6' }
      ];
    }

    if (!payload.sceneType) payload.sceneType = CATEGORY_SCENE[payload.category] || 'default';
    if (!payload.status) payload.status = 'active';

    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      // create an in-memory temp policy so the client can navigate to simulation
      const temp = { ...payload, _id: `temp-${Date.now()}`, isSeeded: false };
      req.app.locals.tempPolicies = req.app.locals.tempPolicies || [];
      req.app.locals.tempPolicies.push(temp);
      return res.status(201).json(temp);
    }

    const policy = await Policy.create(payload);
    res.status(201).json(policy);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const policyId = String(req.params.id);
    const dbConnected = mongoose.connection.readyState === 1;

    if (!dbConnected) {
      const tempPolicies = Array.from(req.app.locals.tempPolicies || []);
      const tempIndex = tempPolicies.findIndex((policy) => String(policy._id) === policyId);
      if (tempIndex >= 0) {
        tempPolicies.splice(tempIndex, 1);
        req.app.locals.tempPolicies = tempPolicies;
        return res.json({ message: 'Policy deleted', id: policyId });
      }

      const seedPolicy = (seedData.POLICIES_DATA || []).find((policy) => String(policy._id) === policyId);
      if (seedPolicy) {
        getDeletedPolicyIds(req).add(policyId);
        return res.json({ message: 'Policy deleted', id: policyId });
      }

      return res.status(404).json({ message: 'Policy not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(policyId)) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const policy = await Policy.findByIdAndDelete(policyId);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy deleted', id: policyId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
