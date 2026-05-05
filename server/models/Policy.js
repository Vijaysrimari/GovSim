const mongoose = require('mongoose');

const PhaseSchema = new mongoose.Schema({
  phase: Number,
  name: String,
  monthStart: Number,
  monthEnd: Number,
  description: String,
  color: String,
  sceneDescription: String
}, { _id: false });

const ImpactDataSchema = new mongoose.Schema({
  month: Number,
  economic: Number,
  social: Number,
  environmental: Number,
  positiveEffects: [{ label: String, value: Number }],
  negativeEffects: [{ label: String, value: Number }]
}, { _id: false });

const PolicySchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  category: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  icon: String,
  color: String,
  accentColor: String,
  tags: [String],
  description: String,
  targetPopulation: String,
  budget: String,
  duration: Number, // months
  status: { type: String, enum: ['draft','active','completed','archived'], default: 'active' },
  phases: [PhaseSchema],
  sceneType: String, // which 3D scene builder to use
  impactData: [ImpactDataSchema],
  positiveImpacts: [{ label: String, icon: String, description: String }],
  negativeImpacts: [{ label: String, icon: String, description: String }],
  netScore: Number,
  peakMonth: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isSeeded: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Policy', PolicySchema);
