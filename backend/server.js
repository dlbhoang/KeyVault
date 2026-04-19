require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const bcrypt  = require('bcryptjs')
const crypto  = require('crypto')
const { db, commit, addLog, Log, User, useMongoDB, Key } = require('./db')
const { sign, requireAdmin, requireUser } = require('./auth')
const { MODULES, KEY_PLANS, genKeyCode, genId, calcExpiry, keyStatus, daysLeft, buildZip, keyModuleIds, createModuleKeysRecord } = require('./keyUtils')
const { getModuleVersion, getAllModulesVersions, checkUpdates, logModuleDownload, getModuleFile, getModuleDownloadHistory } = require('./modules')

const app  = express()
const PORT = process.env.PORT || 3001

// CORS handling
// Allow the frontend to call this API from another origin (e.g., Vercel preview URLs).
// Set `CORS_ALLOWED_ORIGINS` to a comma-separated list of allowed origins (or leave empty to allow all).
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(express.json())

// Simple request logger (helps debug login/network issues)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('  body:', JSON.stringify(req.body).slice(0, 200))
  }
  next()
})

const enrich = k => ({ ...k, status:keyStatus(k), daysLeft:daysLeft(k.expires_at), moduleIds: keyModuleIds(k) })

// Validation helpers
const validatePlan = (plan) => Object.keys(KEY_PLANS).includes(plan)
const validateModuleId = (id) => typeof id === 'string' && MODULES.some(mod => mod.id === id)
/** Ít nhất 1 module; không trùng id trong cùng một license (master + nhiều sub-key). */
const validateModulesPayload = (modules) => {
  if (!Array.isArray(modules) || modules.length < 1) return false
  const uniq = [...new Set(modules.map(String))]
  if (uniq.length !== modules.length) return false
  return uniq.every(validateModuleId)
}

function parseModulesFromBody(body) {
  const { module, modules } = body || {}
  if (module != null && String(module).trim() !== '') return [String(module).trim()]
  if (Array.isArray(modules) && modules.length) return modules.map(String)
  return []
}
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Health check endpoint for CORS testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── AUTH ──────────────────────────────────────────────────────────────────
app.post('/api/auth/admin/login', async (req,res) => {
  try {
    const {username,password}=req.body||{}
    if (!username||!password) return res.status(400).json({error:'Thiếu thông tin đăng nhập'})
    
    const trimmedUser = String(username).trim()
    const trimmedPass = String(password).trim()
    
    if (!trimmedUser || !trimmedPass) return res.status(400).json({error:'Tên và mật khẩu không được để trống'})
    
    const data = await db()
    const a=data.admins.find(x=>x.username===trimmedUser)
    if (!a||!bcrypt.compareSync(trimmedPass,a.password)) return res.status(401).json({error:'Sai tên đăng nhập hoặc mật khẩu'})
    addLog(`Admin "${trimmedUser}" đăng nhập`,'info')
    res.json({ token:sign({role:'admin',username:a.username,id:a.id}), user:{username:a.username,role:'admin'} })
  } catch (e) {
    console.error('Admin login error:', e)
    res.status(500).json({error:'Lỗi máy chủ: ' + e.message})
  }
})

app.post('/api/auth/register', async (req,res) => {
  try {
    const {name,email,password}=req.body||{}
    if (!name||!email||!password) return res.status(400).json({error:'Vui lòng nhập đầy đủ thông tin'})
    if (password.length<6) return res.status(400).json({error:'Mật khẩu tối thiểu 6 ký tự'})
    
    const trimmedEmail = String(email).toLowerCase().trim()
    const trimmedName = String(name).trim()
    const trimmedPass = String(password).trim()
    
    if (!trimmedEmail || !trimmedName || !trimmedPass) return res.status(400).json({error:'Thông tin không hợp lệ'})
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return res.status(400).json({error:'Email không hợp lệ'})
    
    const d = await db()
    if (d.users.find(u=>u.email===trimmedEmail)) return res.status(409).json({error:'Email đã được đăng ký'})
    
    const u={id:genId(),name:trimmedName,email:trimmedEmail,password:bcrypt.hashSync(trimmedPass,10),created_at:new Date().toISOString()}
    
    if (useMongoDB) {
      const user = new User(u)
      await user.save()
    } else {
      d.users.push(u)
      await commit(d)
    }
    
    addLog(`User mới đăng ký: ${trimmedEmail}`,'success')
    res.status(201).json({ token:sign({role:'user',userId:u.id,email:u.email,name:u.name}), user:{id:u.id,name:u.name,email:u.email} })
  } catch (e) {
    console.error('Register error:', e)
    res.status(500).json({error:'Lỗi máy chủ: ' + e.message})
  }
})

app.post('/api/auth/login', async (req,res) => {
  try {
    const {email,password}=req.body||{}
    if (!email||!password) return res.status(400).json({error:'Vui lòng nhập đầy đủ thông tin'})
    
    const trimmedEmail = String(email).toLowerCase().trim()
    const trimmedPass = String(password).trim()
    
    if (!trimmedEmail || !trimmedPass) return res.status(400).json({error:'Email và mật khẩu không được để trống'})
    
    const data = await db()
    const u=data.users.find(x=>x.email===trimmedEmail)
    if (!u||!bcrypt.compareSync(trimmedPass,u.password)) return res.status(401).json({error:'Email hoặc mật khẩu không đúng'})
    addLog(`User "${trimmedEmail}" đăng nhập`,'info')
    res.json({ token:sign({role:'user',userId:u.id,email:u.email,name:u.name}), user:{id:u.id,name:u.name,email:u.email} })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({error:'Lỗi máy chủ: ' + e.message})
  }
})

app.get('/api/auth/me', requireUser, async (req,res) => {
  const d = await db()
  const u = d.users.find(x=>x.id===req.user.userId)
  if (!u) return res.status(404).json({error:'Không tìm thấy user'})

  // Auto-assign pending keys with matching email
  const pendingKeys = d.keys.filter(k => k.email === u.email && !k.user_id && !k.revoked)
  if (pendingKeys.length > 0) {
    if (useMongoDB) {
      // Update keys in MongoDB
      await Promise.all(pendingKeys.map(k => 
        Key.updateOne({ id: k.id }, { user_id: u.id, activated: true })
      ))
    } else {
      // Update in memory for SQLite
      pendingKeys.forEach(k => {
        const idx = d.keys.findIndex(x => x.id === k.id)
        d.keys[idx] = { ...k, user_id: u.id, activated: true }
      })
      await commit(d)
    }
    addLog(`Tự động gán ${pendingKeys.length} key cho user "${u.email}"`, 'info')
  }

  const keys = d.keys.filter(k=>k.user_id===u.id).map(enrich)
  res.json({ user:{id:u.id,name:u.name,email:u.email,created_at:u.created_at}, keys })
})

app.post('/api/auth/forgot-password', async (req,res) => {
  const {email}=req.body||{}
  if (!email || !validateEmail(email)) return res.status(400).json({error:'Email không hợp lệ'})
  const data = await db()
  const u=data.users.find(x=>x.email===(email||'').toLowerCase().trim())
  if (!u) return res.status(404).json({error:'Email không tồn tại trong hệ thống'})
  const token=crypto.randomBytes(32).toString('hex')
  const d = await db()
  d.resetTokens=d.resetTokens.filter(t=>t.email!==u.email)
  d.resetTokens.push({email:u.email,token,expires:new Date(Date.now()+3600000).toISOString()})
  await commit(d)
  addLog(`Reset mật khẩu yêu cầu: ${email}`,'warn')
  res.json({message:'Link đặt lại mật khẩu đã gửi (demo)',resetToken:token})
})

app.post('/api/auth/reset-password', async (req,res) => {
  const {token,newPassword}=req.body||{}
  if (!token||!newPassword) return res.status(400).json({error:'Thiếu thông tin'})
  if (newPassword.length<6) return res.status(400).json({error:'Mật khẩu tối thiểu 6 ký tự'})
  const d = await db()
  const rec=d.resetTokens.find(t=>t.token===token&&new Date(t.expires)>new Date())
  if (!rec) return res.status(400).json({error:'Link hết hạn hoặc không hợp lệ'})
  const idx=d.users.findIndex(u=>u.email===rec.email)
  if (idx===-1) return res.status(404).json({error:'User không tồn tại'})
  d.users[idx].password=bcrypt.hashSync(newPassword,10)
  d.resetTokens=d.resetTokens.filter(t=>t.token!==token)
  await commit(d)
  addLog(`Đặt lại mật khẩu: ${rec.email}`,'success')
  res.json({message:'Mật khẩu đã được đặt lại thành công'})
})

// ─── USER KEY ACTIVATION ───────────────────────────────────────────────────
app.post('/api/keys/activate', requireUser, async (req,res) => {
  const code=(req.body?.keyCode||'').trim().toUpperCase()
  const d = await db()
  const k=d.keys.find(x=>x.key_code===code)
  if (!k)        return res.status(404).json({error:'Key không tồn tại'})
  if (k.revoked) return res.status(400).json({error:'Key đã bị thu hồi'})
  if (daysLeft(k.expires_at)<=0) return res.status(400).json({error:'Key đã hết hạn'})
  if (k.user_id&&k.user_id!==req.user.userId) return res.status(400).json({error:'Key này đã gán cho tài khoản khác'})
  if (k.activated && k.user_id === req.user.userId) return res.status(400).json({error:'Key đã được kích hoạt rồi', key: enrich(k), downloadUrl: `/api/user/keys/${k.id}/download`})
  const idx=d.keys.findIndex(x=>x.id===k.id)
  if (useMongoDB) {
    await Key.updateOne({id: k.id}, {activated: true, user_id: req.user.userId, email: req.user.email, name: req.user.name})
  } else {
    d.keys[idx]={...k,activated:true,user_id:req.user.userId,email:req.user.email,name:req.user.name}
  }
  await commit(d)
  addLog(`User "${req.user.email}" kích hoạt key ${code.slice(0,14)}…`,'success')
  res.json({key:enrich(d.keys[idx]), downloadUrl: `/api/user/keys/${k.id}/download`})
})

// ─── ADMIN KEYS ────────────────────────────────────────────────────────────
app.get('/api/admin/keys', requireAdmin, async (_,res) => {
  const data = await db()
  res.json(data.keys.map(enrich))
})

app.post('/api/admin/keys', requireAdmin, async (req,res) => {
  const {plan,email,name,note,customDate,count=1}=req.body||{}
  const modules = parseModulesFromBody(req.body)
  
  // Validation
  if (!plan||!validateModulesPayload(modules)) return res.status(400).json({error:'Chọn ít nhất 1 module, không trùng lặp'})
  if (!validatePlan(plan)) return res.status(400).json({error:'Gói không hợp lệ'})
  if (email && !validateEmail(email)) return res.status(400).json({error:'Email không hợp lệ'})
  if (count < 1 || count > 50) return res.status(400).json({error:'Số lượng phải từ 1-50'})
  
  const d = await db(); 
  const created=[]
  for(let i=0;i<Math.min(count,50);i++){
    let user_id = null
    let activated = !!email
    if (email) {
      const user = d.users.find(u => u.email === email.toLowerCase().trim())
      if (user) {
        user_id = user.id
        activated = true
      }
    }
    const uniqMods = [...new Set(modules.map(String))]
    const module_keys = createModuleKeysRecord(uniqMods)
    const k={id:genId(),key_code:genKeyCode(),plan,email:email||'',name:name||'',modules:uniqMods,module_keys,note:note||'',expires_at:calcExpiry(plan,customDate),activated,revoked:false,user_id,created_at:new Date().toISOString()}
    if (useMongoDB) {
      const newKey = new Key(k)
      await newKey.save()
    } else {
      d.keys.push(k)
    }
    created.push(enrich(k))
  }
  await commit(d)
  addLog(`Admin tạo ${count} key [${plan}]${email?` cho ${email}`:''}`, 'success')
  res.status(201).json(created)
})

app.patch('/api/admin/keys/:id/revoke', requireAdmin, async (req,res) => {
  const d = await db(); const idx=d.keys.findIndex(k=>k.id===req.params.id)
  if (idx===-1) return res.status(404).json({error:'Không tìm thấy key'})
  if (useMongoDB) {
    await Key.updateOne({id: req.params.id}, {revoked: true})
  } else {
    d.keys[idx].revoked=true
  }
  await commit(d)
  addLog(`Admin thu hồi key ${d.keys[idx].key_code.slice(0,14)}…`,'warn')
  res.json({success:true})
})

app.delete('/api/admin/keys/:id', requireAdmin, async (req,res) => {
  const d = await db(); const k=d.keys.find(x=>x.id===req.params.id)
  if (!k) return res.status(404).json({error:'Không tìm thấy key'})
  if (useMongoDB) {
    await Key.deleteOne({id: req.params.id})
  } else {
    d.keys=d.keys.filter(x=>x.id!==req.params.id)
  }
  await commit(d)
  addLog(`Admin xóa key ${k.key_code.slice(0,14)}…`,'warn')
  res.json({success:true})
})

app.get('/api/admin/keys/:id/download', requireAdmin, async (req,res) => {
  const data = await db()
  const k=data.keys.find(x=>x.id===req.params.id)
  if (!k) return res.status(404).json({error:'Không tìm thấy key'})
  const buf=await buildZip(k)
  res.set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename="KeyVault-${k.key_code.slice(0,8)}.zip"`,'Content-Length':buf.length})
  res.send(buf)
})

// ─── USER DOWNLOAD ─────────────────────────────────────────────────────────
app.get('/api/user/keys/:id/download', requireUser, async (req,res) => {
  const data = await db()
  const k=data.keys.find(x=>x.id===req.params.id && x.user_id===req.user.userId)
  if (!k) return res.status(404).json({error:'Không tìm thấy key hoặc không có quyền'})
  const buf=await buildZip(k)
  res.set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename="KeyVault-${k.key_code.slice(0,8)}.zip"`,'Content-Length':buf.length})
  res.send(buf)
})

// ─── ADMIN USERS ───────────────────────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, async (_,res) => {
  const d = await db()
  // Build key map to avoid O(n²) lookup
  const keyMap = {}
  d.keys.forEach(k => {
    if (k.user_id && !keyMap[k.user_id]) keyMap[k.user_id] = k
  })
  res.json(d.users.map(u=>({id:u.id,name:u.name,email:u.email,createdAt:u.created_at,key:keyMap[u.id]?enrich(keyMap[u.id]):null})))
})

app.delete('/api/admin/users/:id', requireAdmin, async (req,res) => {
  const d = await db(); 
  const u=d.users.find(x=>x.id===req.params.id)
  if (!u) return res.status(404).json({error:'Không tìm thấy user'})
  // Can't delete users with active keys
  const hasActiveKey = d.keys.some(k => k.user_id === u.id && !k.revoked)
  if (hasActiveKey) return res.status(400).json({error:'Không thể xóa user có key hoạt động. Vui lòng thu hồi key trước.'})
  d.users=d.users.filter(x=>x.id!==req.params.id)
  await commit(d)
  addLog(`Admin xóa user ${u.email}`,'warn')
  res.json({success:true})
})

// ─── STATS + LOGS ──────────────────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, async (_,res) => {
  const {keys,users}= await db()
  res.json({
    totalKeys:keys.length, totalUsers:users.length,
    activeKeys:keys.filter(k=>['active','trial'].includes(keyStatus(k))).length,
    expiredKeys:keys.filter(k=>keyStatus(k)==='expired').length,
    pendingKeys:keys.filter(k=>keyStatus(k)==='pending').length,
    expiringIn30:keys.filter(k=>{const dl=daysLeft(k.expires_at);return dl>0&&dl<=30&&!k.revoked}).length,
  })
})
app.get('/api/admin/logs',    requireAdmin, async (_,res) => {
  const data = await db()
  res.json(data.logs)
})

app.delete('/api/admin/logs', requireAdmin, async (_,res) => {
  if (useMongoDB) {
    await Log.deleteMany({})
  } else {
    const d = await db()
    d.logs = []
    await commit(d)
  }
  addLog('Admin cleared logs', 'warn')
  res.json({success:true})
})
app.get('/api/health', async (_,res) => {
  const d = await db()
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      users: d.users.length,
      keys: d.keys.length,
      logs: d.logs.length
    },
    version: '1.0.0'
  })
})

// ─── MODULE LIVE UPDATE SYSTEM ────────────────────────────────────────────
/**
 * GET /api/modules/versions
 * Get current version of all modules (for desktop app to check)
 */
app.get('/api/modules/versions', async (req, res) => {
  const versions = getAllModulesVersions()
  res.json({
    timestamp: new Date().toISOString(),
    modules: versions
  })
})

/**
 * POST /api/modules/check-updates
 * Check which modules have updates available
 * Body: { desktopVersions: {loading: '1.0.0', analysis: '1.0.0', ...} }
 */
app.post('/api/modules/check-updates', requireUser, async (req, res) => {
  try {
    const { desktopVersions = {} } = req.body || {}
    
    // Get user's keys to find their modules
    const data = await db()
    const userKeys = data.keys.filter(k => k.user_id === req.user.userId && !k.revoked && daysLeft(k.expires_at) > 0)
    
    // Collect all modules user has access to
    const userModules = new Set()
    userKeys.forEach(k => {
      keyModuleIds(k).forEach(modId => userModules.add(modId))
    })
    
    // Check for updates
    const updates = checkUpdates(Array.from(userModules), desktopVersions)
    
    // Log the check
    addLog(`User ${req.user.email} checked module updates. Found ${updates.length} available.`, 'info')
    
    res.json({
      timestamp: new Date().toISOString(),
      updates,
      totalAvailable: updates.length,
      userModules: Array.from(userModules),
    })
  } catch (e) {
    console.error('Check updates error:', e)
    res.status(500).json({ error: 'Lỗi kiểm tra cập nhật: ' + e.message })
  }
})

/**
 * GET /api/modules/:moduleId/download?version=1.2.0
 * Download specific module version (validates key access)
 */
app.get('/api/modules/:moduleId/download', requireUser, async (req, res) => {
  try {
    const { moduleId } = req.params
    const { version } = req.query
    
    // Validate module exists
    const moduleInfo = MODULES.find(m => m.id === moduleId)
    if (!moduleInfo) {
      return res.status(404).json({ error: 'Module không tồn tại' })
    }
    
    // Check user has license for this module
    const data = await db()
    const userKeys = data.keys.filter(k => 
      k.user_id === req.user.userId && 
      !k.revoked && 
      daysLeft(k.expires_at) > 0 &&
      keyModuleIds(k).includes(moduleId)
    )
    
    if (userKeys.length === 0) {
      addLog(`User ${req.user.email} attempted unauthorized download of module ${moduleId}`, 'warn')
      return res.status(403).json({ error: 'Bạn không có quyền truy cập module này' })
    }
    
    // Get the module file
    const moduleFile = getModuleFile(moduleId, version)
    if (!moduleFile) {
      return res.status(404).json({ error: 'Phiên bản module không tồn tại' })
    }
    
    // Log download
    logModuleDownload(moduleId, moduleFile.version, req.user, 'user-download')
    addLog(`User ${req.user.email} downloaded module ${moduleId} v${moduleFile.version}`, 'info')
    
    // Send file
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${moduleFile.fileName}.zip"`,
      'Content-Length': moduleFile.fileSize,
      'X-Module-Version': moduleFile.version,
      'X-Module-Hash': moduleFile.hash,
    })
    res.send(moduleFile.buffer)
  } catch (e) {
    console.error('Module download error:', e)
    res.status(500).json({ error: 'Lỗi tải module: ' + e.message })
  }
})

/**
 * GET /api/admin/modules/history
 * Get download history for all modules (admin only)
 */
app.get('/api/admin/modules/history', requireAdmin, async (req, res) => {
  try {
    const { moduleId, limit = 100 } = req.query
    const history = getModuleDownloadHistory(moduleId, parseInt(limit))
    
    res.json({
      timestamp: new Date().toISOString(),
      total: history.length,
      records: history
    })
  } catch (e) {
    console.error('History error:', e)
    res.status(500).json({ error: 'Lỗi lấy lịch sử: ' + e.message })
  }
})

/**
 * GET /api/admin/modules/users-updates
 * For admin: see which users need which module updates
 */
app.get('/api/admin/modules/users-updates', requireAdmin, async (req, res) => {
  try {
    const data = await db()
    const result = []
    
    // For each user with keys
    const usersWithKeys = new Map()
    data.keys.forEach(k => {
      if (k.user_id && !k.revoked && daysLeft(k.expires_at) > 0) {
        if (!usersWithKeys.has(k.user_id)) {
          const user = data.users.find(u => u.id === k.user_id)
          usersWithKeys.set(k.user_id, {
            userId: k.user_id,
            userEmail: user?.email || 'unknown',
            userName: user?.name || 'unknown',
            modules: new Set()
          })
        }
        const userRecord = usersWithKeys.get(k.user_id)
        keyModuleIds(k).forEach(m => userRecord.modules.add(m))
      }
    })
    
    // Convert to array and check updates for each user
    usersWithKeys.forEach((userRecord, userId) => {
      // Note: We don't know their desktop versions, so we assume all modules in their key are "new"
      const updates = checkUpdates(Array.from(userRecord.modules), {})
      result.push({
        ...userRecord,
        modules: Array.from(userRecord.modules),
        availableUpdates: updates,
        updateCount: updates.length
      })
    })
    
    res.json({
      timestamp: new Date().toISOString(),
      totalUsers: result.length,
      usersNeedingUpdates: result.filter(r => r.updateCount > 0).length,
      details: result.sort((a, b) => b.updateCount - a.updateCount)
    })
  } catch (e) {
    console.error('Admin updates report error:', e)
    res.status(500).json({ error: 'Lỗi báo cáo: ' + e.message })
  }
})

// Production: phục vụ SPA (Vite build) cùng origin với /api
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../frontend/dist')
  app.use(express.static(dist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(dist, 'index.html'), err => (err ? next(err) : null))
  })
}

app.listen(PORT, () => {
  console.log(`\n🔑  KeyVault API  →  http://localhost:${PORT}`)
  console.log(`    Admin: admin / admin123\n`)
  console.log(`📦 Module Update System available at:`)
  console.log(`    GET  /api/modules/versions`)
  console.log(`    POST /api/modules/check-updates`)
  console.log(`    GET  /api/modules/:moduleId/download`)
  console.log(`    GET  /api/admin/modules/history`)
  console.log(`    GET  /api/admin/modules/users-updates\n`)
})

module.exports = app
