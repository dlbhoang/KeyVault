import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { useAdminStore, KEY_PLANS } from '../store/index.js'
import { keyModuleIds } from '../utils/keyModules.js'
import { Btn, Tag, Avatar, Spinner, useConfirm } from '../components/ui.jsx'

export default function AdminUsers({ toast }) {
  const { users, loading, loadUsers, deleteUser } = useAdminStore()
  const [search, setSearch] = useState('')
  const { confirm, Dialog } = useConfirm()

  useEffect(() => { loadUsers() }, [])

  const rows = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:24, color:'var(--t1)' }}>Quản lý User</h1>
          <p style={{ color:'var(--t3)', fontSize:13, marginTop:2 }}>{users.length} người dùng đã đăng ký</p>
        </div>
        <Btn variant="white" size="sm" onClick={loadUsers}><RefreshCw size={13}/> Làm mới</Btn>
      </div>

      <div style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:16, overflow:'hidden', boxShadow:'var(--s2)' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1.5px solid var(--b1)', display:'flex', alignItems:'center', gap:10 }}>
          <Search size={14} color="var(--t3)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên, email…"
            style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--t1)', fontSize:13, fontFamily:'var(--f-sans)' }}/>
        </div>

        {loading ? (
          <div style={{ padding:'48px', textAlign:'center' }}><Spinner size={28}/></div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                {['Người dùng','Email','Đăng ký','Key hiện tại','Gói / Modules','Trạng thái',''].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.09em', borderBottom:'1.5px solid var(--b1)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((u,i) => (
                  <motion.tr key={u.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.03}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}
                    style={{ borderBottom:'1px solid var(--b1)', transition:'background .1s' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar text={u.name||'?'} size={32}/>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:'var(--t2)' }}>{u.email}</td>
                    <td style={{ padding:'12px 14px', fontSize:11, color:'var(--t3)', fontFamily:'var(--f-mono)' }}>{u.createdAt ? format(new Date(u.createdAt),'dd/MM/yyyy') : '—'}</td>
                    <td style={{ padding:'12px 14px' }}>
                      {u.key ? <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--indigo-d)', background:'var(--indigo-l)', padding:'2px 7px', borderRadius:5, fontWeight:600 }}>{u.key.keyCode?.slice(0,16)}…</span>
                              : <span style={{ fontSize:12, color:'var(--t3)' }}>Chưa có</span>}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      {u.key ? (
                        <div>
                          <span style={{ fontSize:10, fontWeight:800, background:'var(--indigo-l)', color:'var(--indigo-d)', padding:'2px 8px', borderRadius:6, fontFamily:'var(--f-mono)' }}>{KEY_PLANS[u.key.plan]?.badge||u.key.plan}</span>
                          <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{keyModuleIds(u.key).length} module</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>{u.key ? <Tag status={u.key.status}/> : <span style={{ color:'var(--t3)', fontSize:12 }}>—</span>}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <Btn size="xs" variant="danger" onClick={async()=>{ if(await confirm(`Xóa user "${u.name}" (${u.email})?`)){ await deleteUser(u.id); toast('Đã xóa user','warn') }}}><Trash2 size={11}/> Xóa</Btn>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
        {rows.length===0 && !loading && <div style={{ padding:'44px', textAlign:'center', color:'var(--t3)', fontSize:13 }}>Không tìm thấy user nào</div>}
      </div>
      <Dialog/>
    </div>
  )
}
