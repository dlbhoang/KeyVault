import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { LogOut, KeyRound, CheckCircle2, Copy, Check, Plus, RefreshCw } from 'lucide-react'
import { Btn, Card, Tag, ModuleChips, Spinner, useToast, Toaster, Input, Field } from '../components/ui.jsx'
import { useAuthStore, useUserStore, MODULES, KEY_PLANS } from '../store/index.js'

export default function UserPortal() {
  const { user, logout } = useAuthStore()
  const { keys, loading, loadMe, activateKey } = useUserStore()
  const { list, toast, remove } = useToast()
  const [activating, setActivating] = useState(false)
  const [keyCode, setKeyCode] = useState('')
  const [showActivate, setShowActivate] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => { loadMe() }, [])

  const handleActivate = async () => {
    if (!keyCode.trim()) { toast('Nhập license key!', 'error'); return }
    setActivating(true)
    try {
      const k = await activateKey(keyCode.trim().toUpperCase())
      toast(`✅ Kích hoạt thành công! Gói ${KEY_PLANS[k.plan]?.label}`)
      setKeyCode(''); setShowActivate(false)
    } catch (e) {
      toast(e.message, 'error')
    }
    setActivating(false)
  }

  const copyKey = (code) => {
    navigator.clipboard?.writeText(code)
    setCopied(code); setTimeout(() => setCopied(''), 2000)
    toast('Đã copy key!')
  }

  const formatInput = (v) => {
    const clean = v.replace(/[^A-Z0-9]/g, '').replace(/^KV/, '')
    const parts = ['KV']
    for (let i = 0; i < clean.length && parts.length < 5; i += 6) parts.push(clean.slice(i, i + 6))
    return parts.join('-')
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--g-mesh)' }}>
      {/* Nav */}
      <nav style={{ padding:'14px 32px', background:'rgba(255,255,255,.85)', backdropFilter:'blur(20px)', borderBottom:'1.5px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:'var(--s1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'var(--g-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🔑</div>
          <span style={{ fontWeight:800, fontSize:16 }}>Key<span style={{ color:'var(--indigo)' }}>Vault</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:13, color:'var(--t2)' }}>
            👋 Xin chào, <strong>{user?.name}</strong>
          </div>
          <Btn variant="ghost" size="sm" onClick={logout}><LogOut size={13}/> Đăng xuất</Btn>
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'36px 24px' }}>
        {/* Header */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{ marginBottom:28 }}>
          <h1 style={{ fontWeight:800, fontSize:26, color:'var(--t1)', marginBottom:4 }}>License Keys của tôi</h1>
          <p style={{ color:'var(--t3)', fontSize:14 }}>{keys.length} key đã kích hoạt • {user?.email}</p>
        </motion.div>

        {/* Activate bar */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          style={{ background:'linear-gradient(135deg, rgba(99,102,241,.07), rgba(139,92,246,.06))', border:'1.5px solid var(--b2)', borderRadius:16, padding:'20px 24px', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showActivate?16:0 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)' }}>🔓 Kích hoạt License Key</div>
              <div style={{ fontSize:13, color:'var(--t3)', marginTop:2 }}>Nhập key nhận từ Admin để mở khóa modules</div>
            </div>
            <Btn variant="primary" size="sm" onClick={() => setShowActivate(!showActivate)}>
              <Plus size={13}/> {showActivate ? 'Đóng' : 'Nhập Key'}
            </Btn>
          </div>

          <AnimatePresence>
            {showActivate && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                <div style={{ display:'flex', gap:10 }}>
                  <input
                    value={keyCode}
                    onChange={e => setKeyCode(formatInput(e.target.value.toUpperCase()))}
                    placeholder="KV-XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                    onKeyDown={e => e.key==='Enter' && handleActivate()}
                    style={{ flex:1, background:'white', border:'1.5px solid var(--b2)', borderRadius:10, padding:'10px 14px', fontFamily:'var(--f-mono)', fontSize:13, color:'var(--t1)', outline:'none', letterSpacing:'.06em' }}
                    autoFocus
                  />
                  <Btn variant="primary" onClick={handleActivate} disabled={activating}>
                    {activating ? <><Spinner size={15} color="#fff"/> Đang xử lý…</> : '🔓 Kích hoạt'}
                  </Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Keys list */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'var(--t3)' }}><Spinner size={32} /></div>
        ) : keys.length === 0 ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:18, padding:'60px', textAlign:'center', boxShadow:'var(--s2)' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🔑</div>
            <div style={{ fontWeight:700, fontSize:18, color:'var(--t1)', marginBottom:8 }}>Chưa có license key nào</div>
            <div style={{ fontSize:14, color:'var(--t3)' }}>Kích hoạt key nhận từ Admin để bắt đầu</div>
          </motion.div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {keys.map((k, i) => <KeyCard key={k.id} k={k} i={i} onCopy={copyKey} copied={copied} />)}
          </div>
        )}

        {/* Reload */}
        <div style={{ textAlign:'center', marginTop:20 }}>
          <Btn variant="ghost" size="sm" onClick={loadMe}><RefreshCw size={13}/> Làm mới</Btn>
        </div>
      </div>
      <Toaster list={list} remove={remove} />
    </div>
  )
}

function KeyCard({ k, i, onCopy, copied }) {
  const dl   = k.daysLeft ?? 0
  const plan = KEY_PLANS[k.plan]
  const pct  = Math.max(0, Math.min(100, Math.round(dl / (plan?.days || 365) * 100)))
  const barColor = dl <= 0 ? 'var(--rose)' : dl <= 14 ? 'var(--amber)' : 'var(--indigo)'

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.07}}
      style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:18, overflow:'hidden', boxShadow:'var(--s2)' }}>
      {/* Header stripe */}
      <div style={{ height:3, background: dl <= 0 ? 'var(--rose)' : 'var(--g-brand)' }} />

      <div style={{ padding:'22px 24px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:800, background:'var(--indigo-l)', color:'var(--indigo-d)', padding:'3px 9px', borderRadius:20, letterSpacing:'.06em', fontFamily:'var(--f-mono)' }}>
                {plan?.badge || k.plan}
              </span>
              <Tag status={k.status} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'var(--f-mono)', fontSize:13, color:'var(--indigo-d)', fontWeight:600, wordBreak:'break-all' }}>{k.key_code}</span>
              <motion.button whileHover={{scale:1.1}} whileTap={{scale:.9}} onClick={() => onCopy(k.key_code)}
                style={{ background:'none', border:'none', cursor:'pointer', color: copied===k.key_code?'var(--emerald)':'var(--t3)', padding:2, flexShrink:0, display:'flex' }}>
                {copied === k.key_code ? <Check size={14}/> : <Copy size={14}/>}
              </motion.button>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:12, color:'var(--t3)' }}>Hết hạn</div>
            <div style={{ fontSize:13, fontWeight:700, color: dl<=0?'var(--rose)':dl<=14?'var(--amber)':'var(--t1)' }}>
              {format(new Date(k.expires_at), 'dd/MM/yyyy')}
            </div>
            <div style={{ fontSize:11, color: dl<=0?'var(--rose)':dl<=14?'var(--amber)':'var(--emerald)', fontFamily:'var(--f-mono)', fontWeight:700 }}>
              {dl <= 0 ? 'Đã hết hạn' : `${dl} ngày còn`}
            </div>
          </div>
        </div>

        {/* Progress */}
        {dl > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ background:'var(--surface3)', borderRadius:99, height:6, overflow:'hidden' }}>
              <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.9,ease:'easeOut'}}
                style={{ height:'100%', background: barColor === 'var(--indigo)' ? 'var(--g-brand)' : barColor, borderRadius:99 }}/>
            </div>
          </div>
        )}

        {/* Modules */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
            Modules ({k.modules?.length}/{MODULES.length})
          </div>
          <ModuleChips selected={k.modules || []} readOnly />
        </div>
      </div>
    </motion.div>
  )
}
