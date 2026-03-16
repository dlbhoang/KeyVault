const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_FILE = path.join(process.env.VERCEL ? '/tmp' : __dirname, 'data.db')
const isNew = !fs.existsSync(DB_FILE)

const sqliteDb = new Database(DB_FILE)

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

  // Seed data
  const bcrypt = require('bcryptjs')
  const adminPass = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
  const insertAdmin = sqliteDb.prepare('INSERT INTO admins VALUES (?, ?, ?, ?)')
  insertAdmin.run('admin-1', 'admin', adminPass, new Date().toISOString())

  const { genId, genKeyCode, calcExpiry, MODULES } = require('./keyUtils')
  const allMods = JSON.stringify(MODULES.map(m => m.id))
  const insertKey = sqliteDb.prepare('INSERT INTO keys VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  insertKey.run(genId(), genKeyCode(), 'full6m', 'alice@demo.vn', 'Alice Trần', allMods, 'Demo trial', calcExpiry('full6m'), 1, 0, null, new Date().toISOString())
  insertKey.run(genId(), genKeyCode(), 'desktop1y', 'bob@demo.io', 'Bob Nguyễn', JSON.stringify(['analytics','reports','api']), '', calcExpiry('desktop1y'), 1, 0, null, new Date().toISOString())
  insertKey.run(genId(), genKeyCode(), 'full1y', '', '', allMods, 'Chờ gán user', calcExpiry('full1y'), 0, 0, null, new Date().toISOString())
}

const selectAdmins = sqliteDb.prepare('SELECT * FROM admins')
const selectUsers = sqliteDb.prepare('SELECT * FROM users')
const selectKeys = sqliteDb.prepare('SELECT * FROM keys')
const selectLogs = sqliteDb.prepare('SELECT * FROM logs ORDER BY created_at DESC')
const selectResetTokens = sqliteDb.prepare('SELECT * FROM reset_tokens')

let _cache = null

function loadCache() {
  if (_cache) return _cache
  _cache = {
    admins: selectAdmins.all(),
    users: selectUsers.all(),
    keys: selectKeys.all().map(k => ({ ...k, modules: JSON.parse(k.modules), activated: !!k.activated, revoked: !!k.revoked })),
    logs: selectLogs.all(),
    resetTokens: selectResetTokens.all()
  }
  return _cache
}

function db() { return loadCache() }

function commit() {
  const d = _cache
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
}

function addLog(message, type='info') {
  const log = { id: Date.now().toString(), message, type, created_at: new Date().toISOString() }
  _cache.logs.unshift(log)
  if (_cache.logs.length > 200) _cache.logs = _cache.logs.slice(0, 200)
  commit()
}

module.exports = { db, commit, addLog }
