const fs   = require('fs')
const path = require('path')
const DB_FILE = path.join(__dirname, 'data.json')
const DEFAULT = { admins:[], users:[], keys:[], logs:[], resetTokens:[] }

let _db = (() => {
  if (!fs.existsSync(DB_FILE)) return JSON.parse(JSON.stringify(DEFAULT))
  try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')) }
  catch { return JSON.parse(JSON.stringify(DEFAULT)) }
})()

function db() { return _db }
function commit() { fs.writeFileSync(DB_FILE, JSON.stringify(_db, null, 2),'utf8') }
function addLog(message, type='info') {
  _db.logs.unshift({ id:Date.now().toString(), message, type, created_at:new Date().toISOString() })
  if (_db.logs.length > 200) _db.logs = _db.logs.slice(0,200)
  commit()
}
module.exports = { db, commit, addLog }
