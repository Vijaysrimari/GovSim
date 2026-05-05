// simulations.js
const simRouter = require('express').Router();
simRouter.get('/', (req, res) => res.json({ message: 'Use /api/policies/:id/simulation' }));
module.exports = simRouter;

// ---- categories.js is separate ----
