require('dotenv').config()
const jwt    = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'keyvault-secret-2025-unsafe-fallback'

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in .env. Using unsafe fallback.')
  console.warn('   Please set JWT_SECRET in .env file for production.')
}

const sign   = (payload, exp='7d') => jwt.sign(payload, SECRET, { expiresIn:exp })
const verify = (token) => jwt.verify(token, SECRET)

function guard(role) {
  return (req, res, next) => {
    const h = req.headers.authorization
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ error:'Unauthorized' })
    try {
      const p = verify(h.slice(7))
      if (p.role !== role) return res.status(403).json({ error:'Forbidden' })
      req[role] = p
      next()
    } catch { res.status(401).json({ error:'Token hết hạn hoặc không hợp lệ' }) }
  }
}

module.exports = { sign, verify, requireAdmin: guard('admin'), requireUser: guard('user') }
