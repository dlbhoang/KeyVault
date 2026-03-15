import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ShieldCheck, ArrowLeft, KeyRound, Eye } from 'lucide-react'
import { Btn, Input, Field, Spinner } from '../components/ui.jsx'
import { useAuthStore } from '../store/index.js'

// ── Shared wrapper ──────────────────────────────────────────────────────────
function AuthCard({ children, title, subtitle, badge }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--g-mesh)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {/* Decorative blobs */}
      <div style={{ position:'fixed', top:'-10%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-10%', left:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,.10) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <motion.div initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} transition={{type:'spring',damping:24,stiffness:220}}
        style={{ width:'100%', maxWidth:420, background:'white', borderRadius:22, boxShadow:'0 32px 80px rgba(30,27,75,.16)', border:'1.5px solid var(--b1)', overflow:'hidden' }}>
        {/* Top gradient stripe */}
        <div style={{ height:4, background:'var(--g-brand)' }}/>
        <div style={{ padding:'32px 34px' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:'var(--g-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'var(--s-indigo)' }}>🔑</div>
            <span style={{ fontWeight:800, fontSize:17, color:'var(--t1)' }}>Key<span style={{ color:'var(--indigo)' }}>Vault</span></span>
            {badge && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, background:'var(--indigo-l)', color:'var(--indigo-d)', padding:'3px 9px', borderRadius:20, letterSpacing:'.06em' }}>{badge}</span>}
          </div>
          <h2 style={{ fontWeight:800, fontSize:24, color:'var(--t1)', marginBottom:6 }}>{title}</h2>
          {subtitle && <p style={{ fontSize:14, color:'var(--t3)', marginBottom:24, lineHeight:1.6 }}>{subtitle}</p>}
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ── ADMIN LOGIN ─────────────────────────────────────────────────────────────
export function AdminLogin({ onSuccess, onBack }) {
  const { adminLogin, loading, error, clearError } = useAuthStore()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const isDirectAccess = window.location.pathname === '/admin'

  useEffect(() => { clearError() }, [])

  const submit = async () => {
    if (await adminLogin(u, p)) onSuccess()
  }

  return (
    <AuthCard title="Đăng nhập Admin" subtitle="Truy cập bảng điều khiển quản trị" badge="ADMIN">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Tên đăng nhập" error={error&&!p?error:''}>
          <Input icon={<User size={15}/>} placeholder="Tên đăng nhập" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus />
        </Field>
        <Field label="Mật khẩu" error={error}>
          <Input icon={<Lock size={15}/>} type="password" placeholder="••••••••" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        </Field>

        <Btn variant="primary" onClick={submit} disabled={loading} full style={{ marginTop:4 }}>
          {loading ? <><Spinner size={16} color="#fff"/> Đang đăng nhập…</> : <><ShieldCheck size={15}/> Đăng nhập</>}
        </Btn>

        <div style={{ padding:'10px 14px', background:'var(--surface2)', borderRadius:9, border:'1.5px solid var(--b1)', fontSize:12, color:'var(--t3)', lineHeight:1.8 }}>
          <span style={{ color:'var(--indigo)', fontWeight:700 }}>Demo: </span>
          username: <code style={{ fontFamily:'var(--f-mono)', color:'var(--indigo-d)', background:'var(--indigo-l)', padding:'1px 5px', borderRadius:4 }}>admin</code>
          {' / '}password: <code style={{ fontFamily:'var(--f-mono)', color:'var(--indigo-d)', background:'var(--indigo-l)', padding:'1px 5px', borderRadius:4 }}>admin123</code>
        </div>

        {!isDirectAccess && (
          <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5, justifyContent:'center', marginTop:4 }}>
            <ArrowLeft size={13}/> Quay lại trang chủ
          </button>
        )}
      </div>
    </AuthCard>
  )
}

// ── USER LOGIN ──────────────────────────────────────────────────────────────
export function UserLogin({ onSuccess, onRegister, onForgot, onBack }) {
  const { login, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')

  useEffect(() => { clearError() }, [])

  const submit = async () => {
    if (await login(email, pass)) onSuccess()
  }

  return (
    <AuthCard title="Đăng nhập" subtitle="Đăng nhập để xem và quản lý license key của bạn">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Email" error={''}>
          <Input icon={<Mail size={15}/>} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus />
        </Field>
        <Field label="Mật khẩu" error={error}>
          <Input icon={<Lock size={15}/>} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        </Field>

        <div style={{ textAlign:'right', marginTop:-6 }}>
          <button onClick={onForgot} style={{ background:'none', border:'none', color:'var(--indigo)', fontSize:12, cursor:'pointer', fontWeight:600 }}>Quên mật khẩu?</button>
        </div>

        <Btn variant="primary" onClick={submit} disabled={loading} full>
          {loading ? <><Spinner size={16} color="#fff"/> Đang đăng nhập…</> : 'Đăng nhập'}
        </Btn>

        <div style={{ textAlign:'center', fontSize:13, color:'var(--t3)', marginTop:4 }}>
          Chưa có tài khoản?{' '}
          <button onClick={onRegister} style={{ background:'none', border:'none', color:'var(--indigo)', fontWeight:700, cursor:'pointer', fontSize:13 }}>Đăng ký ngay</button>
        </div>

        <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, justifyContent:'center' }}>
          <ArrowLeft size={12}/> Về trang chủ
        </button>
      </div>
    </AuthCard>
  )
}

// ── USER REGISTER ───────────────────────────────────────────────────────────
export function UserRegister({ onSuccess, onLogin, onBack }) {
  const { register, loading, error, clearError } = useAuthStore()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [pass2, setPass2] = useState('')
  const [localErr, setLocalErr] = useState('')

  useEffect(() => { clearError() }, [])

  const submit = async () => {
    setLocalErr('')
    if (!name.trim() || !email.trim() || !pass) { setLocalErr('Vui lòng nhập đầy đủ thông tin'); return }
    if (pass !== pass2) { setLocalErr('Mật khẩu xác nhận không khớp'); return }
    if (await register(name, email, pass)) onSuccess()
  }

  const err = localErr || error

  return (
    <AuthCard title="Tạo tài khoản" subtitle="Đăng ký để nhận và kích hoạt license key">
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <Field label="Tên của bạn">
          <Input icon={<User size={15}/>} placeholder="Nguyễn Văn A" value={name} onChange={e=>setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Email">
          <Input icon={<Mail size={15}/>} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </Field>
        <Field label="Mật khẩu">
          <Input icon={<Lock size={15}/>} type="password" placeholder="Tối thiểu 6 ký tự" value={pass} onChange={e=>setPass(e.target.value)} />
        </Field>
        <Field label="Xác nhận mật khẩu" error={err}>
          <Input icon={<Lock size={15}/>} type="password" placeholder="Nhập lại mật khẩu" value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        </Field>

        <Btn variant="primary" onClick={submit} disabled={loading} full style={{ marginTop:2 }}>
          {loading ? <><Spinner size={16} color="#fff"/> Đang tạo tài khoản…</> : '🎉 Tạo tài khoản'}
        </Btn>

        <div style={{ textAlign:'center', fontSize:13, color:'var(--t3)' }}>
          Đã có tài khoản?{' '}
          <button onClick={onLogin} style={{ background:'none', border:'none', color:'var(--indigo)', fontWeight:700, cursor:'pointer', fontSize:13 }}>Đăng nhập</button>
        </div>

        <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, justifyContent:'center' }}>
          <ArrowLeft size={12}/> Về trang chủ
        </button>
      </div>
    </AuthCard>
  )
}

// ── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export function ForgotPassword({ onBack }) {
  const { forgotPassword, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => { clearError() }, [])

  const submit = async () => {
    const r = await forgotPassword(email)
    if (r) setResult(r)
  }

  return (
    <AuthCard title="Quên mật khẩu?" subtitle="Nhập email để nhận link đặt lại mật khẩu">
      {result ? (
        <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}}>
          <div style={{ background:'var(--emerald-l)', border:'1.5px solid rgba(16,185,129,.2)', borderRadius:12, padding:'18px 16px', marginBottom:16 }}>
            <div style={{ fontWeight:700, color:'var(--emerald)', marginBottom:8 }}>✅ Đã gửi!</div>
            <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.7 }}>
              Trong môi trường demo, token của bạn là:
            </div>
            <div style={{ fontFamily:'var(--f-mono)', fontSize:11, background:'white', padding:'8px 10px', borderRadius:8, marginTop:8, wordBreak:'break-all', color:'var(--indigo-d)', border:'1.5px solid var(--b1)' }}>
              {result.resetToken}
            </div>
          </div>
          <Btn variant="ghost" onClick={onBack} full><ArrowLeft size={13}/> Quay lại đăng nhập</Btn>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Email đã đăng ký" error={error}>
            <Input icon={<Mail size={15}/>} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus />
          </Field>
          <Btn variant="primary" onClick={submit} disabled={loading} full>
            {loading ? <><Spinner size={16} color="#fff"/> Đang gửi…</> : '📧 Gửi link đặt lại'}
          </Btn>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5, justifyContent:'center' }}>
            <ArrowLeft size={13}/> Quay lại đăng nhập
          </button>
        </div>
      )}
    </AuthCard>
  )
}

// ── RESET PASSWORD ──────────────────────────────────────────────────────────
export function ResetPassword({ token, onSuccess, onBack }) {
  const { resetPassword, loading, error, clearError } = useAuthStore()
  const [pass,  setPass]  = useState('')
  const [pass2, setPass2] = useState('')
  const [localErr, setLocalErr] = useState('')

  useEffect(() => { clearError() }, [])

  const submit = async () => {
    if (pass !== pass2) { setLocalErr('Mật khẩu không khớp'); return }
    if (await resetPassword(token, pass)) onSuccess()
  }

  return (
    <AuthCard title="Đặt lại mật khẩu" subtitle="Nhập mật khẩu mới cho tài khoản của bạn">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Mật khẩu mới">
          <Input icon={<Lock size={15}/>} type="password" placeholder="Tối thiểu 6 ký tự" value={pass} onChange={e=>setPass(e.target.value)} autoFocus />
        </Field>
        <Field label="Xác nhận mật khẩu" error={localErr || error}>
          <Input icon={<Lock size={15}/>} type="password" placeholder="Nhập lại mật khẩu" value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        </Field>
        <Btn variant="primary" onClick={submit} disabled={loading} full>
          {loading ? <><Spinner size={16} color="#fff"/> Đang đặt lại…</> : '✅ Đặt lại mật khẩu'}
        </Btn>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--t3)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5, justifyContent:'center' }}>
          <ArrowLeft size={13}/> Quay lại
        </button>
      </div>
    </AuthCard>
  )
}
