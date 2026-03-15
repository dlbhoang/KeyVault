import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useAdminStore, MODULES } from '../store/index.js'
import { StatCard, Btn } from '../components/ui.jsx'

export default function Dashboard({ onCreateKey }) {
  const { stats, keys, logs, loadStats, loadKeys, loadLogs } = useAdminStore()
  useEffect(() => { loadStats(); loadKeys(); loadLogs() }, [])

  const expiring = keys
    .filter(k => { const dl = k.daysLeft; return dl > 0 && dl <= 30 && !k.revoked })
    .sort((a,b) => a.daysLeft - b.daysLeft).slice(0,6)

  const LC = { success:'var(--emerald)', warn:'var(--amber)', danger:'var(--rose)', info:'var(--indigo)' }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:26 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:24, color:'var(--t1)' }}>Dashboard</h1>
          <p style={{ color:'var(--t3)', fontSize:13, marginTop:2 }}>Tổng quan hệ thống license</p>
        </div>
        <Btn onClick={onCreateKey}><span>＋</span> Tạo Key Mới</Btn>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Tổng Key',        value:stats?.totalKeys??'…',    sub:'key trong hệ thống',    gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)', icon:'🔑' },
          { label:'Đang hoạt động',  value:stats?.activeKeys??'…',   sub:'key còn hiệu lực',      gradient:'linear-gradient(135deg,#10b981,#0ea5e9)', icon:'✅' },
          { label:'Hết hạn',         value:stats?.expiredKeys??'…',  sub:'cần gia hạn',            gradient:'linear-gradient(135deg,#f43f5e,#f59e0b)', icon:'⏰' },
          { label:'Người dùng',      value:stats?.totalUsers??'…',   sub:'tài khoản đã đăng ký',  gradient:'linear-gradient(135deg,#0ea5e9,#6366f1)', icon:'👥' },
        ].map((s,i) => (
          <motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.07}}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Expiring */}
        <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:.28}}
          style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:16, overflow:'hidden', boxShadow:'var(--s2)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1.5px solid var(--b1)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>⚡</span>
            <span style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>Key sắp hết hạn</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--t3)' }}>trong 30 ngày</span>
          </div>
          {expiring.length === 0
            ? <div style={{ padding:'32px', textAlign:'center', color:'var(--t3)', fontSize:13 }}>🎉 Không có key sắp hết hạn</div>
            : expiring.map(k => {
                const c = k.daysLeft<=7?'var(--rose)':k.daysLeft<=14?'var(--amber)':'var(--emerald)'
                return (
                  <div key={k.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 20px', borderBottom:'1px solid var(--b1)' }}>
                    <div>
                      <div style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--indigo-d)', fontWeight:600 }}>{k.key_code?.slice(0,20)}…</div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:1 }}>{k.email||'Chưa gán'}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:800, color:c, background:`${c}18`, padding:'2px 10px', borderRadius:20, fontFamily:'var(--f-mono)' }}>{k.daysLeft}d</div>
                  </div>
                )
              })
          }
        </motion.div>

        {/* Activity */}
        <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:.32}}
          style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:16, overflow:'hidden', boxShadow:'var(--s2)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1.5px solid var(--b1)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>🕐</span>
            <span style={{ fontWeight:700, fontSize:14, color:'var(--t1)' }}>Hoạt động gần đây</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            {(logs||[]).slice(0,7).map((l,i) => (
              <div key={l.id} style={{ display:'flex', alignItems:'flex-start', gap:11, padding:'11px 0', borderBottom:i<6?'1px solid var(--b1)':'none' }}>
                <div style={{ width:7, height:7, borderRadius:4, background:LC[l.type]||'var(--indigo)', marginTop:5, flexShrink:0, boxShadow:`0 0 5px ${LC[l.type]||'var(--indigo)'}66` }}/>
                <div>
                  <div style={{ fontSize:12, color:'var(--t1)' }}>{l.message}</div>
                  <div style={{ fontSize:10, color:'var(--t3)', marginTop:2, fontFamily:'var(--f-mono)' }}>{format(new Date(l.created_at),'dd/MM HH:mm')}</div>
                </div>
              </div>
            ))}
            {(!logs||logs.length===0) && <div style={{ padding:'32px 0', textAlign:'center', color:'var(--t3)', fontSize:13 }}>Chưa có hoạt động</div>}
          </div>
        </motion.div>
      </div>

      {/* Module usage */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.42}}
        style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:16, padding:'20px 22px', marginTop:18, boxShadow:'var(--s2)' }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--t1)', marginBottom:16 }}>🧩 Thống kê Modules</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {MODULES.map(m => {
            const cnt = keys.filter(k => k.modules?.includes(m.id) && !k.revoked).length
            const pct = keys.length ? (cnt/keys.length)*100 : 0
            return (
              <div key={m.id} style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 14px', border:'1.5px solid var(--b1)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                  <span style={{ fontSize:17 }}>{m.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--t1)' }}>{m.name}</span>
                </div>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:7 }}>{cnt}/{keys.length} key</div>
                <div style={{ background:'var(--b1)', borderRadius:99, height:4, overflow:'hidden' }}>
                  <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.8,delay:.5}}
                    style={{ height:'100%', background:m.color, borderRadius:99 }}/>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
