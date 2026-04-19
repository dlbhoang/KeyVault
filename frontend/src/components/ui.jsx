import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, AlertCircle, Info, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { MODULES } from '../store/index.js'

// ── BUTTON ─────────────────────────────────────────────────────────────────
const BV = {
  primary: { bg:'var(--g-brand)', color:'#fff', border:'none', shadow:'var(--s-indigo)' },
  sky:     { bg:'var(--g-sky)',   color:'#fff', border:'none', shadow:'0 8px 24px rgba(14,165,233,.35)' },
  ghost:   { bg:'transparent',   color:'var(--t2)', border:'1.5px solid var(--b2)', shadow:'none' },
  white:   { bg:'#fff',          color:'var(--t1)', border:'1.5px solid var(--b2)', shadow:'var(--s1)' },
  danger:  { bg:'var(--rose-l)', color:'var(--rose)', border:'1.5px solid rgba(244,63,94,.2)', shadow:'none' },
  success: { bg:'var(--emerald-l)', color:'var(--emerald)', border:'1.5px solid rgba(16,185,129,.2)', shadow:'none' },
  indigo:  { bg:'var(--indigo-l)', color:'var(--indigo-d)', border:'1.5px solid var(--b2)', shadow:'none' },
}
const BS = {
  xs: { padding:'4px 10px',  fontSize:11, borderRadius:7,  gap:4  },
  sm: { padding:'7px 14px',  fontSize:13, borderRadius:8,  gap:5  },
  md: { padding:'10px 20px', fontSize:14, borderRadius:10, gap:6  },
  lg: { padding:'13px 28px', fontSize:15, borderRadius:12, gap:7  },
}

export function Btn({ children, variant='primary', size='md', onClick, disabled, full=false, style={} }) {
  const v = BV[variant] || BV.primary
  const s = BS[size]
  return (
    <motion.button
      whileHover={!disabled ? { scale:1.025, y:-1 } : {}}
      whileTap={!disabled ? { scale:0.975 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:s.gap, background:v.bg, color:v.color, border:v.border, boxShadow:v.shadow, borderRadius:s.borderRadius, fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.55:1, transition:'box-shadow .15s', fontFamily:'var(--f-sans)', width:full?'100%':'auto', ...s, ...style }}
    >{children}</motion.button>
  )
}

// ── TEXT INPUT ─────────────────────────────────────────────────────────────
const inputBase = {
  width:'100%', background:'#fff', border:'1.5px solid var(--b1)', color:'var(--t1)',
  padding:'10px 14px', borderRadius:10, fontFamily:'var(--f-sans)', fontSize:14,
  outline:'none', transition:'all .2s',
}

export function Input({ type='text', icon, rightEl, style, ...props }) {
  const [f, setF] = useState(false)
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div style={{ position:'relative' }}>
      {icon && <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: f?'var(--indigo)':'var(--t3)', transition:'color .2s', display:'flex' }}>{icon}</span>}
      <input
        type={isPass && show ? 'text' : type}
        style={{ ...inputBase, paddingLeft: icon?40:14, paddingRight: isPass||rightEl ? 40:14, borderColor: f?'var(--indigo)':'var(--b1)', boxShadow: f?'0 0 0 3.5px rgba(99,102,241,.12)':inputBase.boxShadow, background: f?'#fff':'var(--surface)', ...style }}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        {...props}
      />
      {isPass && (
        <button type="button" onClick={() => setShow(!show)}
          style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', display:'flex', padding:2 }}>
          {show ? <EyeOff size={15}/> : <Eye size={15}/>}
        </button>
      )}
      {rightEl && !isPass && <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>{rightEl}</span>}
    </div>
  )
}

export function Select({ children, icon, style, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      {icon && <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', display:'flex', pointerEvents:'none' }}>{icon}</span>}
      <select style={{ ...inputBase, paddingLeft:icon?40:14, appearance:'none', cursor:'pointer', borderColor:f?'var(--indigo)':'var(--b1)', boxShadow:f?'0 0 0 3.5px rgba(99,102,241,.12)':'none', ...style }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} {...props}>
        {children}
      </select>
      <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', pointerEvents:'none', fontSize:11 }}>▼</span>
    </div>
  )
}

export function Textarea({ style, ...props }) {
  const [f, setF] = useState(false)
  return <textarea style={{ ...inputBase, resize:'vertical', minHeight:80, borderColor:f?'var(--indigo)':'var(--b1)', boxShadow:f?'0 0 0 3.5px rgba(99,102,241,.12)':'none', ...style }}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...props} />
}

// ── FIELD ──────────────────────────────────────────────────────────────────
export function Field({ label, error, hint, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, fontWeight:700, color:'var(--t2)', letterSpacing:'.02em' }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize:12, color:'var(--rose)', display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={12}/>{error}</span>}
      {hint && !error && <span style={{ fontSize:12, color:'var(--t3)' }}>{hint}</span>}
    </div>
  )
}

// ── CARD ───────────────────────────────────────────────────────────────────
export function Card({ children, style, hover=false }) {
  return (
    <motion.div whileHover={hover?{y:-2,boxShadow:'var(--s3)'}:{}}
      style={{ background:'var(--surface)', border:'1.5px solid var(--b1)', borderRadius:'var(--radius-lg)', boxShadow:'var(--s2)', ...style }}>
      {children}
    </motion.div>
  )
}

// ── MODAL ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children, footer, maxW=520 }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          onClick={e=>e.target===e.currentTarget&&onClose()}
          style={{ position:'fixed', inset:0, background:'rgba(30,27,75,.45)', backdropFilter:'blur(12px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <motion.div initial={{scale:.93,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:.93,opacity:0,y:20}}
            transition={{type:'spring',damping:24,stiffness:300}}
            style={{ background:'var(--surface)', border:'1.5px solid var(--b2)', borderRadius:20, width:'100%', maxWidth:maxW, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(30,27,75,.22)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'22px 26px 18px', borderBottom:'1.5px solid var(--b1)' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:'var(--t1)' }}>{title}</div>
                {subtitle && <div style={{ fontSize:13, color:'var(--t3)', marginTop:3 }}>{subtitle}</div>}
              </div>
              <motion.button whileHover={{scale:1.1,rotate:90}} whileTap={{scale:.9}} onClick={onClose}
                style={{ background:'var(--surface3)', border:'1.5px solid var(--b1)', borderRadius:8, padding:'5px 8px', cursor:'pointer', color:'var(--t3)', display:'flex', flexShrink:0, marginLeft:12 }}>
                <X size={14}/>
              </motion.button>
            </div>
            <div style={{ padding:'22px 26px', display:'flex', flexDirection:'column', gap:16 }}>{children}</div>
            {footer && <div style={{ padding:'16px 26px', borderTop:'1.5px solid var(--b1)', display:'flex', justifyContent:'flex-end', gap:10, background:'var(--surface2)', borderRadius:'0 0 20px 20px' }}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── BADGE / TAG ────────────────────────────────────────────────────────────
const tagMap = {
  active:   { bg:'var(--emerald-l)', color:'#059669', txt:'● Active'        },
  trial:    { bg:'var(--indigo-l)',  color:'#4f46e5', txt:'◈ Trial'         },
  pending:  { bg:'var(--amber-l)',   color:'#d97706', txt:'◌ Chờ kích hoạt' },
  expired:  { bg:'var(--rose-l)',    color:'#e11d48', txt:'✕ Hết hạn'       },
  revoked:  { bg:'#f1f5f9',         color:'#94a3b8', txt:'— Thu hồi'       },
}
export function Tag({ status }) {
  const t = tagMap[status] || tagMap.pending
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:t.bg, color:t.color, whiteSpace:'nowrap', letterSpacing:'.03em', fontFamily:'var(--f-mono)' }}>{t.txt}</span>
}

// ── STAT CARD ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, gradient, icon }) {
  return (
    <motion.div whileHover={{y:-3,boxShadow:'var(--s3)'}} transition={{type:'spring',stiffness:300,damping:22}}
      style={{ background:'var(--surface)', border:'1.5px solid var(--b1)', borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden', boxShadow:'var(--s2)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:gradient }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }}>{label}</div>
          <div style={{ fontFamily:'var(--f-mono)', fontSize:36, fontWeight:800, background:gradient, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>{sub}</div>}
        </div>
        {icon && <div style={{ width:44, height:44, borderRadius:12, background:`${gradient.includes('6366')? 'var(--indigo-l)':'var(--emerald-l)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>}
      </div>
    </motion.div>
  )
}

// ── AVATAR ─────────────────────────────────────────────────────────────────
const AC = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#f43f5e','#d946ef']
export function Avatar({ text='?', size=34 }) {
  const c = AC[(text.charCodeAt(0)||0) % AC.length]
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:`${c}18`, border:`2px solid ${c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.35, fontWeight:700, color:c, flexShrink:0 }}>
      {(text||'?').slice(0,2).toUpperCase()}
    </div>
  )
}

// ── MODULE CHIPS ───────────────────────────────────────────────────────────
export function ModuleChips({ selected, onChange, readOnly=false }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
      {MODULES.map(m => {
        const on = selected?.includes(m.id)
        return (
          <motion.button key={m.id} type="button"
            whileHover={!readOnly?{scale:1.05}:{}} whileTap={!readOnly?{scale:.96}:{}}
            onClick={readOnly ? undefined : () => onChange(on ? selected.filter(x=>x!==m.id) : [...(selected||[]),m.id])}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, cursor:readOnly?'default':'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:'var(--f-sans)', border:'1.5px solid',
              background: on ? `${m.color}14` : 'var(--surface)',
              borderColor: on ? `${m.color}44` : 'var(--b1)',
              color: on ? m.color : 'var(--t3)',
            }}>
            <span>{m.icon}</span>
            <span style={{ fontFamily:'var(--f-mono)', fontSize:11, opacity:0.85 }}>[{m.groupCode}]</span>
            {m.name}
          </motion.button>
        )
      })}
    </div>
  )
}

// ── TOAST ──────────────────────────────────────────────────────────────────
const TI = { success:<Check size={14}/>, error:<AlertCircle size={14}/>, warn:<AlertTriangle size={14}/>, info:<Info size={14}/> }
const TC = { success:'var(--emerald)', error:'var(--rose)', warn:'var(--amber)', info:'var(--indigo)' }
const TB = { success:'var(--emerald-l)', error:'var(--rose-l)', warn:'var(--amber-l)', info:'var(--indigo-l)' }

export function useToast() {
  const [list, setList] = useState([])
  const toast = useCallback((msg, type='success') => {
    const id = Date.now()
    setList(p => [...p, { id, msg, type }])
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3800)
  }, [])
  const remove = useCallback(id => setList(p => p.filter(t => t.id !== id)), [])
  return { list, toast, remove }
}

export function Toaster({ list, remove }) {
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8, maxWidth:360 }}>
      <AnimatePresence>
        {list.map(t => (
          <motion.div key={t.id} initial={{opacity:0,x:50,scale:.92}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:50,scale:.92}}
            onClick={()=>remove(t.id)} style={{ background:TB[t.type]||TB.info, border:`1.5px solid ${TC[t.type]}33`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', boxShadow:'var(--s3)' }}>
            <span style={{ color:TC[t.type], display:'flex', flexShrink:0 }}>{TI[t.type]}</span>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--t1)' }}>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── CONFIRM DIALOG ─────────────────────────────────────────────────────────
export function useConfirm() {
  const [state, setState] = useState({ open:false, msg:'', resolve:null })
  const confirm = msg => new Promise(res => setState({ open:true, msg, resolve:res }))
  const Dialog = () => (
    <Modal open={state.open} onClose={() => { state.resolve(false); setState(s=>({...s,open:false})) }} title="Xác nhận" maxW={380}
      footer={<><Btn variant="ghost" onClick={() => { state.resolve(false); setState(s=>({...s,open:false})) }}>Hủy</Btn><Btn variant="danger" onClick={() => { state.resolve(true); setState(s=>({...s,open:false})) }}>Xác nhận</Btn></>}>
      <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.7 }}>{state.msg}</p>
    </Modal>
  )
  return { confirm, Dialog }
}

// ── SPINNER ────────────────────────────────────────────────────────────────
export function Spinner({ size=20, color='var(--indigo)' }) {
  return (
    <motion.div animate={{rotate:360}} transition={{duration:.7,repeat:Infinity,ease:'linear'}}
      style={{ width:size, height:size, border:`2.5px solid ${color}22`, borderTopColor:color, borderRadius:'50%', flexShrink:0 }}/>
  )
}
