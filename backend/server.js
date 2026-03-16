require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const bcrypt  = require('bcryptjs')
const crypto  = require('crypto')
const { db, commit, addLog } = require('./db')
const { sign, requireAdmin, requireUser } = require('./auth')
const { MODULES, KEY_PLANS, genKeyCode, genId, calcExpiry, keyStatus, daysLeft, buildZip } = require('./keyUtils')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: true, // Allow all origins for Vercel
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Simple CORS headers for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json())

// ─── SEED ──────────────────────────────────────────────────────────────────
;(() => {
  const d = db()
  if (!d.admins.find(a => a.username === 'admin')) {
    d.admins.push({ id:'admin-1', username:'admin', password:bcrypt.hashSync(process.env.ADMIN_PASSWORD||'admin123',10), created_at:new Date().toISOString() })
    commit()
  }
  if (d.keys.length === 0) {
    const all = MODULES.map(m=>m.id)
    d.keys.push(
      { id:genId(), key_code:genKeyCode(), plan:'full6m',    email:'alice@demo.vn', name:'Alice Trần', modules:all,                          note:'Demo trial',   expires_at:calcExpiry('full6m'),    activated:true,  revoked:false, user_id:null, created_at:new Date().toISOString() },
      { id:genId(), key_code:genKeyCode(), plan:'desktop1y', email:'bob@demo.io',   name:'Bob Nguyễn', modules:['analytics','reports','api'], note:'',            expires_at:calcExpiry('desktop1y'), activated:true,  revoked:false, user_id:null, created_at:new Date().toISOString() },
      { id:genId(), key_code:genKeyCode(), plan:'full1y',    email:'',              name:'',           modules:all,                          note:'Chờ gán user', expires_at:calcExpiry('full1y'),    activated:false, revoked:false, user_id:null, created_at:new Date().toISOString() }
    )
    addLog('Khởi động: seed dữ liệu mẫu','info')
    commit()
  }
})()

const enrich = k => ({ ...k, status:keyStatus(k), daysLeft:daysLeft(k.expires_at) })

// Health check endpoint for CORS testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── AUTH ──────────────────────────────────────────────────────────────────
app.post('/api/auth/admin/login', (req,res) => {
  const {username,password}=req.body||{}
  if (!username||!password) return res.status(400).json({error:'Thiếu thông tin đăng nhập'})
  const a=db().admins.find(x=>x.username===username)
  if (!a||!bcrypt.compareSync(password,a.password)) return res.status(401).json({error:'Sai tên đăng nhập hoặc mật khẩu'})
  addLog(`Admin "${username}" đăng nhập`,'info')
  res.json({ token:sign({role:'admin',username:a.username,id:a.id}), user:{username:a.username,role:'admin'} })
})

app.post('/api/auth/register', (req,res) => {
  const {name,email,password}=req.body||{}
  if (!name||!email||!password) return res.status(400).json({error:'Vui lòng nhập đầy đủ thông tin'})
  if (password.length<6) return res.status(400).json({error:'Mật khẩu tối thiểu 6 ký tự'})
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'Email không hợp lệ'})
  const d=db()
  if (d.users.find(u=>u.email===email.toLowerCase())) return res.status(409).json({error:'Email đã được đăng ký'})
  const u={id:genId(),name:name.trim(),email:email.toLowerCase().trim(),password:bcrypt.hashSync(password,10),created_at:new Date().toISOString()}
  d.users.push(u); commit()
  addLog(`User mới đăng ký: ${email}`,'success')
  res.status(201).json({ token:sign({role:'user',userId:u.id,email:u.email,name:u.name}), user:{id:u.id,name:u.name,email:u.email} })
})

app.post('/api/auth/login', (req,res) => {
  const {email,password}=req.body||{}
  if (!email||!password) return res.status(400).json({error:'Vui lòng nhập đầy đủ thông tin'})
  const u=db().users.find(x=>x.email===email.toLowerCase().trim())
  if (!u||!bcrypt.compareSync(password,u.password)) return res.status(401).json({error:'Email hoặc mật khẩu không đúng'})
  addLog(`User "${email}" đăng nhập`,'info')
  res.json({ token:sign({role:'user',userId:u.id,email:u.email,name:u.name}), user:{id:u.id,name:u.name,email:u.email} })
})

app.get('/api/auth/me', requireUser, (req,res) => {
  const d = db()
  const u = d.users.find(x=>x.id===req.user.userId)
  if (!u) return res.status(404).json({error:'Không tìm thấy user'})

  // Auto-assign pending keys with matching email
  const pendingKeys = d.keys.filter(k => k.email === u.email && !k.user_id && !k.revoked)
  pendingKeys.forEach(k => {
    const idx = d.keys.findIndex(x => x.id === k.id)
    d.keys[idx] = { ...k, user_id: u.id, activated: true }
  })
  if (pendingKeys.length > 0) {
    commit()
    addLog(`Tự động gán ${pendingKeys.length} key cho user "${u.email}"`, 'info')
  }

  const keys = d.keys.filter(k=>k.user_id===u.id).map(enrich)
  res.json({ user:{id:u.id,name:u.name,email:u.email,created_at:u.created_at}, keys })
})

app.post('/api/auth/forgot-password', (req,res) => {
  const {email}=req.body||{}
  const u=db().users.find(x=>x.email===(email||'').toLowerCase().trim())
  if (!u) return res.status(404).json({error:'Email không tồn tại trong hệ thống'})
  const token=crypto.randomBytes(32).toString('hex')
  const d=db()
  d.resetTokens=d.resetTokens.filter(t=>t.email!==u.email)
  d.resetTokens.push({email:u.email,token,expires:new Date(Date.now()+3600000).toISOString()})
  commit()
  addLog(`Reset mật khẩu yêu cầu: ${email}`,'warn')
  res.json({message:'Link đặt lại mật khẩu đã gửi (demo)',resetToken:token})
})

app.post('/api/auth/reset-password', (req,res) => {
  const {token,newPassword}=req.body||{}
  if (!token||!newPassword) return res.status(400).json({error:'Thiếu thông tin'})
  if (newPassword.length<6) return res.status(400).json({error:'Mật khẩu tối thiểu 6 ký tự'})
  const d=db()
  const rec=d.resetTokens.find(t=>t.token===token&&new Date(t.expires)>new Date())
  if (!rec) return res.status(400).json({error:'Link hết hạn hoặc không hợp lệ'})
  const idx=d.users.findIndex(u=>u.email===rec.email)
  if (idx===-1) return res.status(404).json({error:'User không tồn tại'})
  d.users[idx].password=bcrypt.hashSync(newPassword,10)
  d.resetTokens=d.resetTokens.filter(t=>t.token!==token)
  commit()
  addLog(`Đặt lại mật khẩu: ${rec.email}`,'success')
  res.json({message:'Mật khẩu đã được đặt lại thành công'})
})

// ─── USER KEY ACTIVATION ───────────────────────────────────────────────────
app.post('/api/keys/activate', requireUser, (req,res) => {
  const code=(req.body?.keyCode||'').trim().toUpperCase()
  const d=db()
  const k=d.keys.find(x=>x.key_code===code)
  if (!k)        return res.status(404).json({error:'Key không tồn tại'})
  if (k.revoked) return res.status(400).json({error:'Key đã bị thu hồi'})
  if (daysLeft(k.expires_at)<=0) return res.status(400).json({error:'Key đã hết hạn'})
  if (k.user_id&&k.user_id!==req.user.userId) return res.status(400).json({error:'Key này đã gán cho tài khoản khác'})
  if (k.activated && k.user_id === req.user.userId) return res.status(400).json({error:'Key đã được kích hoạt rồi', key: enrich(k), downloadUrl: `/api/user/keys/${k.id}/download`})
  const idx=d.keys.findIndex(x=>x.id===k.id)
  d.keys[idx]={...k,activated:true,user_id:req.user.userId,email:req.user.email,name:req.user.name}
  commit()
  addLog(`User "${req.user.email}" kích hoạt key ${code.slice(0,14)}…`,'success')
  res.json({key:enrich(d.keys[idx]), downloadUrl: `/api/user/keys/${k.id}/download`})
})

// ─── ADMIN KEYS ────────────────────────────────────────────────────────────
app.get('/api/admin/keys', requireAdmin, (_,res) => res.json(db().keys.map(enrich)))

app.post('/api/admin/keys', requireAdmin, (req,res) => {
  const {plan,email,name,modules,note,customDate,count=1}=req.body||{}
  if (!plan||!modules?.length) return res.status(400).json({error:'Thiếu thông tin'})
  const d=db(); const created=[]
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
    const k={id:genId(),key_code:genKeyCode(),plan,email:email||'',name:name||'',modules,note:note||'',expires_at:calcExpiry(plan,customDate),activated,revoked:false,user_id,created_at:new Date().toISOString()}
    d.keys.push(k); created.push(enrich(k))
  }
  commit()
  addLog(`Admin tạo ${count} key [${plan}]${email?` cho ${email}`:''}`, 'success')
  res.status(201).json(created)
})

app.patch('/api/admin/keys/:id/revoke', requireAdmin, (req,res) => {
  const d=db(); const idx=d.keys.findIndex(k=>k.id===req.params.id)
  if (idx===-1) return res.status(404).json({error:'Không tìm thấy key'})
  d.keys[idx].revoked=true; commit()
  addLog(`Admin thu hồi key ${d.keys[idx].key_code.slice(0,14)}…`,'warn')
  res.json({success:true})
})

app.delete('/api/admin/keys/:id', requireAdmin, (req,res) => {
  const d=db(); const k=d.keys.find(x=>x.id===req.params.id)
  if (!k) return res.status(404).json({error:'Không tìm thấy key'})
  d.keys=d.keys.filter(x=>x.id!==req.params.id); commit()
  addLog(`Admin xóa key ${k.key_code.slice(0,14)}…`,'warn')
  res.json({success:true})
})

app.get('/api/admin/keys/:id/download', requireAdmin, async (req,res) => {
  const k=db().keys.find(x=>x.id===req.params.id)
  if (!k) return res.status(404).json({error:'Không tìm thấy key'})
  const buf=await buildZip(k)
  res.set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename="KeyVault-${k.key_code.slice(0,8)}.zip"`,'Content-Length':buf.length})
  res.send(buf)
})

// ─── USER DOWNLOAD ─────────────────────────────────────────────────────────
app.get('/api/user/keys/:id/download', requireUser, async (req,res) => {
  const k=db().keys.find(x=>x.id===req.params.id && x.user_id===req.user.userId)
  if (!k) return res.status(404).json({error:'Không tìm thấy key hoặc không có quyền'})
  const buf=await buildZip(k)
  res.set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename="KeyVault-${k.key_code.slice(0,8)}.zip"`,'Content-Length':buf.length})
  res.send(buf)
})

// ─── ADMIN USERS ───────────────────────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, (_,res) => {
  const d=db()
  res.json(d.users.map(u=>({id:u.id,name:u.name,email:u.email,createdAt:u.created_at,key:d.keys.find(k=>k.user_id===u.id)?enrich(d.keys.find(k=>k.user_id===u.id)):null})))
})

app.delete('/api/admin/users/:id', requireAdmin, (req,res) => {
  const d=db(); const u=d.users.find(x=>x.id===req.params.id)
  if (!u) return res.status(404).json({error:'Không tìm thấy user'})
  d.users=d.users.filter(x=>x.id!==req.params.id); commit()
  addLog(`Admin xóa user ${u.email}`,'warn')
  res.json({success:true})
})

// ─── STATS + LOGS ──────────────────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, (_,res) => {
  const {keys,users}=db()
  res.json({
    totalKeys:keys.length, totalUsers:users.length,
    activeKeys:keys.filter(k=>['active','trial'].includes(keyStatus(k))).length,
    expiredKeys:keys.filter(k=>keyStatus(k)==='expired').length,
    pendingKeys:keys.filter(k=>keyStatus(k)==='pending').length,
    expiringIn30:keys.filter(k=>{const dl=daysLeft(k.expires_at);return dl>0&&dl<=30&&!k.revoked}).length,
  })
})
app.get('/api/admin/logs',    requireAdmin, (_,res) => res.json(db().logs))
app.delete('/api/admin/logs', requireAdmin, (_,res) => {db().logs=[];commit();res.json({success:true})})
app.get('/api/health', (_,res) => {
  const d = db()
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

app.listen(PORT, () => {
  console.log(`\n🔑  KeyVault API  →  http://localhost:${PORT}`)
  console.log(`    Admin: admin / admin123\n`)
})

module.exports = app
