const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { genId, genKeyCode, calcExpiry, MODULES } = require('./keyUtils')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/keyvault'

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

// Schemas
const adminSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  created_at: Date
})

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true },
  password: String,
  created_at: Date
})

const keySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  key_code: { type: String, unique: true },
  plan: String,
  email: String,
  name: String,
  modules: [String],
  note: String,
  expires_at: Date,
  activated: Boolean,
  revoked: Boolean,
  user_id: String,
  created_at: Date
})

const logSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  message: String,
  type: String,
  created_at: Date
})

const resetTokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  expires: Date
})

// Models
const Admin = mongoose.model('Admin', adminSchema)
const User = mongoose.model('User', userSchema)
const Key = mongoose.model('Key', keySchema)
const Log = mongoose.model('Log', logSchema)
const ResetToken = mongoose.model('ResetToken', resetTokenSchema)