const router = require('express').Router();
const { Category } = require('../models/User');
const mongoose = require('mongoose');
const seedData = require('../data/seed');

router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seedCategories = seedData.CATEGORIES || [];
      const tempPolicies = Array.from(req.app.locals.tempPolicies || []);
      const deletedIds = req.app.locals.deletedPolicyIds || new Set();
      const allPolicies = [...(seedData.POLICIES_DATA || []), ...tempPolicies].filter((policy) => !deletedIds.has(String(policy._id)));
      const counts = allPolicies.reduce((acc, policy) => {
        acc[policy.category] = (acc[policy.category] || 0) + 1;
        return acc;
      }, {});

      return res.json(seedCategories.map((category) => ({
        _id: `cat-${category.slug}`,
        ...category,
        policyCount: counts[category.name] || 0
      })));
    }

    const cats = await Category.find().sort({ name: 1 });
    res.json(cats);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
