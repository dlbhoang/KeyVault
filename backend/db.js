const fs = require('fs')
const path = require('path')

// Use /tmp for Vercel, current directory for local development
const DB_DIR = process.env.VERCEL ? '/tmp' : __dirname
const DB_FILE = path.join(DB_DIR, 'data.json')

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// Initialize database
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const bcrypt = require('bcryptjs')
    const { genId, genKeyCode, calcExpiry, MODULES } = require('./keyUtils')

    const initialData = {
      admins: [{
        id: 'admin-1',
        username: 'admin',
        password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
        created_at: new Date().toISOString()
      }],
      users: [],
      keys: [
        {
          id: genId(),
          key_code: genKeyCode(),
          plan: 'full6m',
          email: 'alice@demo.vn',
          name: 'Alice Trần',
          modules: MODULES.map(m => m.id),
          note: 'Demo trial',
          expires_at: calcExpiry('full6m'),
          activated: true,
          revoked: false,
          user_id: null,
          created_at: new Date().toISOString()
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
          created_at: new Date().toISOString()
        },
        {
          id: genId(),
          key_code: genKeyCode(),
          plan: 'full1y',
          email: '',
          name: '',
          modules: MODULES.map(m => m.id),
          note: 'Chờ gán user',
          expires_at: calcExpiry('full1y'),
          activated: false,
          revoked: false,
          user_id: null,
          created_at: new Date().toISOString()
        }
      ],
      logs: [],
      resetTokens: []
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2))
  }
}

initDb()

let _cache = null

function loadCache() {
  if (_cache) return _cache
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
    _cache = data
    return _cache
  } catch (e) {
    // If file is corrupted, reinitialize
    initDb()
    return loadCache()
  }
}

function db() {
  return loadCache()
}

function commit() {
  if (_cache) {
    fs.writeFileSync(DB_FILE, JSON.stringify(_cache, null, 2))
  }
}

function addLog(message, type = 'info') {
  const log = {
    id: Date.now().toString(),
    message,
    type,
    created_at: new Date().toISOString()
  }
  loadCache().logs.unshift(log)
  if (loadCache().logs.length > 200) {
    loadCache().logs = loadCache().logs.slice(0, 200)
  }
  commit()
}

module.exports = { db, commit, addLog }
