const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { genId, genKeyCode, calcExpiry, MODULES } = require('./keyUtils')

const useMongoDB = !!process.env.MONGODB_URI

const TEMP_DATA_PATH = process.env.DATA_FILE || path.join(process.env.TMPDIR || '/tmp', 'keyvault-data.json')
const LOCAL_DATA_PATH = path.join(__dirname, 'data.json')

const getDataFilePath = () => {
  // Use explicit override if set; otherwise prefer /tmp for serverless writable filesystem.
  if (process.env.DATA_FILE) return process.env.DATA_FILE
  try {
    fs.accessSync(path.dirname(TEMP_DATA_PATH), fs.constants.W_OK)
    return TEMP_DATA_PATH
  } catch (err) {
    return LOCAL_DATA_PATH
  }
}

// ---------- MongoDB (optional) ----------
let mongoose, Admin, User, Key, Log, ResetToken

if (useMongoDB) {
  mongoose = require('mongoose')

  const MONGODB_URI = process.env.MONGODB_URI
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err))

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
  }, { collection: 'app_users' })

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

  Admin = mongoose.model('Admin', adminSchema)
  User = mongoose.model('User', userSchema)
  Key = mongoose.model('Key', keySchema)
  Log = mongoose.model('Log', logSchema)
  ResetToken = mongoose.model('ResetToken', resetTokenSchema)
}

// ---------- SQLite fallback (local dev) ----------
let sqliteDb
let sqliteCache = null
let useSqlite = false

function initSqlite() {
  try {
    const Database = require('better-sqlite3')
    const DB_FILE = path.join(__dirname, 'data.db')
    const isNew = !fs.existsSync(DB_FILE)
    sqliteDb = new Database(DB_FILE)
    useSqlite = true
    console.log('✅ Using SQLite database')

    if (isNew) {
      sqliteDb.exec(`CREATE TABLE admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        created_at TEXT
      )`)

      sqliteDb.exec(`CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        created_at TEXT
      )`)

      sqliteDb.exec(`CREATE TABLE keys (
        id TEXT PRIMARY KEY,
        key_code TEXT UNIQUE,
        plan TEXT,
        email TEXT,
        name TEXT,
        modules TEXT,
        note TEXT,
        expires_at TEXT,
        activated INTEGER,
        revoked INTEGER,
        user_id TEXT,
        created_at TEXT
      )`)

      sqliteDb.exec(`CREATE TABLE logs (
        id TEXT PRIMARY KEY,
        message TEXT,
        type TEXT,
        created_at TEXT
      )`)

      sqliteDb.exec(`CREATE TABLE reset_tokens (
        email TEXT,
        token TEXT,
        expires TEXT
      )`)

      // Seed values
      seedDatabase()
    }
  } catch (err) {
    console.warn('⚠️  SQLite not available, using JSON fallback:', err.message)
    useSqlite = false
    initJsonFallback()
  }
}

function initJsonFallback() {
  const DATA_FILE = getDataFilePath()
  if (!fs.existsSync(DATA_FILE)) {
    const seedData = {
      admins:
        { id: 'admin-1', username: 'admin', password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10), created_at: new Date().toISOString() }
      ],
      users: [],
      keys: [
        { id: genId(), key_code: genKeyCode(), plan: 'full6m', email: 'alice@demo.vn', name: 'Alice Trần', modules: MODULES.map(m => m.id), note: 'Demo trial', expires_at: calcExpiry('full6m'), activated: true, revoked: false, user_id: null, created_at: new Date().toISOString() },
        { id: genId(), key_code: genKeyCode(), plan: 'desktop1y', email: 'bob@demo.io', name: 'Bob Nguyễn', modules: ['analytics','reports','api'], note: '', expires_at: calcExpiry('desktop1y'), activated: true, revoked: false, user_id: null, created_at: new Date().toISOString() },
        { id: genId(), key_code: genKeyCode(), plan: 'full1y', email: '', name: '', modules: MODULES.map(m => m.id), note: 'Chờ gán user', expires_at: calcExpiry('full1y'), activated: false, revoked: false, user_id: null, created_at: new Date().toISOString() }
      ],
      logs: [],
      resetTokens: []
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2))
  }
  console.log('✅ Using JSON file database')
}

function seedDatabase() {
  const adminPass = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
  sqliteDb.prepare('INSERT INTO admins VALUES (?, ?, ?, ?)').run('admin-1', 'admin', adminPass, new Date().toISOString())

  const allMods = JSON.stringify(MODULES.map(m => m.id))
  const insertKey = sqliteDb.prepare('INSERT INTO keys VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  insertKey.run(genId(), genKeyCode(), 'full6m', 'alice@demo.vn', 'Alice Trần', allMods, 'Demo trial', calcExpiry('full6m'), 1, 0, null, new Date().toISOString())
  insertKey.run(genId(), genKeyCode(), 'desktop1y', 'bob@demo.io', 'Bob Nguyễn', JSON.stringify(['analytics','reports','api']), '', calcExpiry('desktop1y'), 1, 0, null, new Date().toISOString())
  insertKey.run(genId(), genKeyCode(), 'full1y', '', '', allMods, 'Chờ gán user', calcExpiry('full1y'), 0, 0, null, new Date().toISOString())
}

function loadSqlite() {
  if (sqliteCache) return sqliteCache
  
  if (useSqlite) {
    sqliteCache = {
      admins: sqliteDb.prepare('SELECT * FROM admins').all(),
      users: sqliteDb.prepare('SELECT * FROM users').all(),
      keys: sqliteDb.prepare('SELECT * FROM keys').all().map(k => ({ ...k, modules: JSON.parse(k.modules), activated: !!k.activated, revoked: !!k.revoked })),
      logs: sqliteDb.prepare('SELECT * FROM logs ORDER BY created_at DESC').all(),
      resetTokens: sqliteDb.prepare('SELECT * FROM reset_tokens').all()
    }
  } else {
    const DATA_FILE = getDataFilePath()
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    sqliteCache = data
  }
  
  return sqliteCache
}

function commitSqlite() {
  const d = sqliteCache
  if (!d) return

  if (useSqlite) {
    const transaction = sqliteDb.transaction(() => {
      sqliteDb.prepare('DELETE FROM admins').run()
      const insertAdmin = sqliteDb.prepare('INSERT INTO admins VALUES (?, ?, ?, ?)')
      d.admins.forEach(a => insertAdmin.run(a.id, a.username, a.password, a.created_at))

      sqliteDb.prepare('DELETE FROM users').run()
      const insertUser = sqliteDb.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)')
      d.users.forEach(u => insertUser.run(u.id, u.name, u.email, u.password, u.created_at))

      sqliteDb.prepare('DELETE FROM keys').run()
      const insertKey = sqliteDb.prepare('INSERT INTO keys VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      d.keys.forEach(k => insertKey.run(k.id, k.key_code, k.plan, k.email, k.name, JSON.stringify(k.modules), k.note, k.expires_at, k.activated ? 1 : 0, k.revoked ? 1 : 0, k.user_id, k.created_at))

      sqliteDb.prepare('DELETE FROM logs').run()
      const insertLog = sqliteDb.prepare('INSERT INTO logs VALUES (?, ?, ?, ?)')
      d.logs.forEach(l => insertLog.run(l.id, l.message, l.type, l.created_at))

      sqliteDb.prepare('DELETE FROM reset_tokens').run()
      const insertToken = sqliteDb.prepare('INSERT INTO reset_tokens VALUES (?, ?, ?)')
      d.resetTokens.forEach(t => insertToken.run(t.email, t.token, t.expires))
    })
    transaction()
  } else {
    // JSON fallback
    const DATA_FILE = getDataFilePath()
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2))
  }
}

function addLogSqlite(message, type = 'info') {
  const log = { id: Date.now().toString(), message, type, created_at: new Date().toISOString() }
  const d = loadSqlite()
  d.logs.unshift(log)
  if (d.logs.length > 200) d.logs = d.logs.slice(0, 200)
  commitSqlite()
}

function initSqliteData() {
  if (!useSqlite && sqliteCache === null) {
    initSqlite()
  }
  if (sqliteCache === null) {
    loadSqlite()
  }
}

// ---------- Exported API ----------

async function db() {
  if (useMongoDB) {
    const [admins, users, keys, logs, resetTokens] = await Promise.all([
      Admin.find().lean(),
      User.find().lean(),
      Key.find().lean(),
      Log.find().sort({ created_at: -1 }).lean(),
      ResetToken.find().lean(),
    ])
    return { admins, users, keys, logs, resetTokens }
  }
  initSqliteData()
  return loadSqlite()
}

async function commit(data) {
  if (useMongoDB) {
    // In Mongo we can update individual docs as we go; this is a no-op
    // but kept for compatibility with existing code.
    return
  }
  sqliteCache = data
  commitSqlite()
}

async function addLog(message, type = 'info') {
  if (useMongoDB) {
    const log = new Log({ id: Date.now().toString(), message, type, created_at: new Date() })
    await log.save()

    const logCount = await Log.countDocuments()
    if (logCount > 200) {
      const oldestLogs = await Log.find().sort({ created_at: 1 }).limit(logCount - 200)
      await Log.deleteMany({ _id: { $in: oldestLogs.map(l => l._id) } })
    }
    return
  }
  addLogSqlite(message, type)
}

module.exports = { db, commit, addLog, User, Admin, Key, Log, ResetToken, useMongoDB }
