import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Key, Users, FileText, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore, useAdminStore } from '../store/index.js'
import { Toaster, useToast } from '../components/ui.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import AdminKeys from './AdminKeys.jsx'
import AdminUsers from './AdminUsers.jsx'
import { CreateKeyModal, LogsPage } from './AdminExtra.jsx'

const NAV = [
  { id:'dashboard', label:'Dashboard',   icon:<LayoutDashboard size={16}/> },
  { id:'keys',      label:'Quản lý Key', icon:<Key size={16}/>             },
  { id:'users',     label:'Quản lý User',icon:<Users size={16}/>           },
  { id:'logs',      label:'Activity Log',icon:<FileText size={16}/>        },
]

export default function AdminLayout() {
  const { user, logout }  = useAuthStore()
  const keys = useAdminStore(s => s.keys)
  const { list, toast, remove } = useToast()
  const [page, setPage]      = useState('dashboard')
  const [keyModal, setKeyModal] = useState(false)

  const pendingKeys = keys.filter(k => k.status === 'pending').length

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      {/* ── SIDEBAR ── */}
      <motion.aside initial={{x:-260}} animate={{x:0}} transition={{type:'spring',damping:24,stiffness:220}}
        style={{ width:232, background:'white', borderRight:'1.5px solid var(--b1)', display:'flex', flexDirection:'column', flexShrink:0, boxShadow:'var(--s2)' }}>

        {/* Logo */}
        <div style={{ padding:'22px 20px 16px', borderBottom:'1.5px solid var(--b1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'var(--g-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'var(--s-indigo)' }}>🔑</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:'var(--t1)', lineHeight:1 }}>Key<span style={{ color:'var(--indigo)' }}>Vault</span></div>
              <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Create key CTA */}
        <div style={{ padding:'14px 14px 8px' }}>
          <motion.button whileHover={{scale:1.02,y:-1}} whileTap={{scale:.98}} onClick={()=>setKeyModal(true)}
            style={{ width:'100%', padding:'10px 14px', borderRadius:11, background:'var(--g-brand)', border:'none', color:'white', fontFamily:'var(--f-sans)', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'var(--s-indigo)' }}>
            <span style={{fontSize:16}}>＋</span> Tạo Key Mới
          </motion.button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'6px 10px', overflowY:'auto' }}>
          <div style={{ fontSize:9, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.14em', padding:'8px 10px 4px' }}>Menu</div>
          {NAV.map(n => {
            const active = page === n.id
            const badge  = n.id==='keys' && pendingKeys > 0 ? pendingKeys : 0
            return (
              <motion.div key={n.id} whileHover={{x:2}} onClick={()=>setPage(n.id)}
                style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:10, cursor:'pointer', marginBottom:2, transition:'all .14s',
                  background: active ? 'var(--indigo-l)' : 'transparent',
                  borderLeft: `3px solid ${active?'var(--indigo)':'transparent'}`,
                }}>
                <span style={{ color: active?'var(--indigo)':'var(--t3)', display:'flex', transition:'color .14s' }}>{n.icon}</span>
                <span style={{ flex:1, fontSize:13, fontWeight: active?700:500, color: active?'var(--indigo-d)':'var(--t2)', transition:'all .14s' }}>{n.label}</span>
                {badge>0 && <span style={{ background:'var(--amber)', color:'white', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:99, lineHeight:1.5 }}>{badge}</span>}
                {active && <ChevronRight size={13} color="var(--indigo)" style={{opacity:.6}}/>}
              </motion.div>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding:'14px', borderTop:'1.5px solid var(--b1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'8px 10px', background:'var(--surface2)', borderRadius:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'var(--g-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white', fontWeight:700 }}>
              {user?.username?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)' }}>{user?.username}</div>
              <div style={{ fontSize:10, color:'var(--t3)' }}>Administrator</div>
            </div>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:.98}} onClick={logout}
            style={{ width:'100%', padding:'8px 14px', borderRadius:9, background:'var(--rose-l)', border:'none', color:'var(--rose)', fontFamily:'var(--f-sans)', fontWeight:600, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <LogOut size={13}/> Đăng xuất
          </motion.button>
        </div>
      </motion.aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, overflowY:'auto', padding:'32px 36px', background:'var(--g-mesh)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}}>
            {page==='dashboard' && <AdminDashboard onCreateKey={()=>setKeyModal(true)} />}
            {page==='keys'      && <AdminKeys onCreateKey={()=>setKeyModal(true)} toast={toast} />}
            {page==='users'     && <AdminUsers toast={toast} />}
            {page==='logs'      && <LogsPage toast={toast} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <CreateKeyModal open={keyModal} onClose={()=>setKeyModal(false)} toast={toast} />
      <Toaster list={list} remove={remove} />
    </div>
  )
}
