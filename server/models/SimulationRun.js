const mongoose = require('mongoose');

const SimulationRunSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  month: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  snapshot: {
    economic: Number,
    social: Number,
    environmental: Number,
    negativePeak: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('SimulationRun', SimulationRunSchema);
