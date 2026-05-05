const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['analyst','admin'], default: 'analyst' },
  avatar: String,
  savedPolicies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' }]
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  icon: String,
  color: String,
  description: String,
  policyCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Category: mongoose.model('Category', CategorySchema)
};
