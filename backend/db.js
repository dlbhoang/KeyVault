const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { genId, genKeyCode, calcExpiry, MODULES } = require('./keyUtils')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/keyvault'

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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

// Initialize data if empty
async function initData() {
  const adminCount = await Admin.countDocuments()
  if (adminCount === 0) {
    const adminPass = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
    await Admin.create({
      id: 'admin-1',
      username: 'admin',
      password: adminPass,
      created_at: new Date()
    })
  }

  const keyCount = await Key.countDocuments()
  if (keyCount === 0) {
    const allMods = MODULES.map(m => m.id)
    await Key.create([
      {
        id: genId(),
        key_code: genKeyCode(),
        plan: 'full6m',
        email: 'alice@demo.vn',
        name: 'Alice Trần',
        modules: allMods,
        note: 'Demo trial',
        expires_at: calcExpiry('full6m'),
        activated: true,
        revoked: false,
        user_id: null,
        created_at: new Date()
      },
      {
        id: genId(),
        key_code: genKeyCode(),
        plan: 'desktop1y',
        email: 'bob@demo.io',
        name: 'Bob Nguyễn',
        modules: ['analytics', 'reports', 'api'],
        note: '',
        expires_at: calcExpiry('desktop1y'),
        activated: true,
        revoked: false,
        user_id: null,
        created_at: new Date()
      },
      {
        id: genId(),
        key_code: genKeyCode(),
        plan: 'full1y',
        email: '',
        name: '',
        modules: allMods,
        note: 'Chờ gán user',
        expires_at: calcExpiry('full1y'),
        activated: false,
        revoked: false,
        user_id: null,
        created_at: new Date()
      }
    ])
  }
}

initData()

// Database functions
async function db() {
  const [admins, users, keys, logs, resetTokens] = await Promise.all([
    Admin.find().lean(),
    User.find().lean(),
    Key.find().lean(),
    Log.find().sort({ created_at: -1 }).lean(),
    ResetToken.find().lean()
  ])

  return {
    admins,
    users,
    keys,
    logs,
    resetTokens
  }
}

async function commit(data) {
  // Clear and re-insert data
  await Promise.all([
    Admin.deleteMany({}),
    User.deleteMany({}),
    Key.deleteMany({}),
    ResetToken.deleteMany({})
  ])

  if (data.admins.length > 0) await Admin.insertMany(data.admins)
  if (data.users.length > 0) await User.insertMany(data.users)
  if (data.keys.length > 0) await Key.insertMany(data.keys)
  if (data.resetTokens.length > 0) await ResetToken.insertMany(data.resetTokens)

  // Logs are handled separately
}

async function addLog(message, type = 'info') {
  const log = new Log({
    id: Date.now().toString(),
    message,
    type,
    created_at: new Date()
  })
  await log.save()

  // Keep only last 200 logs
  const logCount = await Log.countDocuments()
  if (logCount > 200) {
    const oldestLogs = await Log.find().sort({ created_at: 1 }).limit(logCount - 200)
    await Log.deleteMany({ _id: { $in: oldestLogs.map(l => l._id) } })
  }
}

module.exports = { db, commit, addLog, Admin, User, Key, Log, ResetToken }
