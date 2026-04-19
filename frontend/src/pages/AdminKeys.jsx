import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { useAdminStore, KEY_PLANS } from '../store/index.js'
import { keyModuleIds } from '../utils/keyModules.js'
import { Btn, Tag, Modal, ModuleChips, useConfirm, Spinner } from '../components/ui.jsx'
import { adminApi } from '../utils/api.js'

export default function AdminKeys({ onCreateKey, toast }) {
  const { keys, loading, loadKeys, revokeKey, deleteKey } = useAdminStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [dlBusy, setDlBusy] = useState('')
  const { confirm, Dialog } = useConfirm()

  useEffect(() => { loadKeys() }, [])

  const TABS = [
    { k:'all',     label:'Tất cả',       n:keys.length },
    { k:'active',  label:'Active',        n:keys.filter(x=>x.status==='active').length  },
    { k:'trial',   label:'Trial',         n:keys.filter(x=>x.status==='trial').length   },
    { k:'pending', label:'Chờ kích hoạt', n:keys.filter(x=>x.status==='pending').length },
    { k:'expired', label:'Hết hạn',       n:keys.filter(x=>x.status==='expired').length },
    { k:'revoked', label:'Thu hồi',       n:keys.filter(x=>x.status==='revoked').length },
  ]

  const rows = keys.filter(k => {
    if (filter !== 'all' && k.status !== filter) return false
    const q = search.toLowerCase()
    return !q || (k.key_code||'').toLowerCase().includes(q) || (k.email||'').toLowerCase().includes(q) || (k.name||'').toLowerCase().includes(q)
  })

  const download = async (k) => {
    setDlBusy(k.id)
    const token = localStorage.getItem('kv_token')
    try {
      const res = await fetch(adminApi.downloadZipUrl(k.id), { headers:{ Authorization:`Bearer ${token}` } })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download=`KeyVault-${k.key_code?.slice(0,8)}.zip`; a.click()
      URL.revokeObjectURL(url)
      toast(`📦 Đã tải ${k.key_code?.slice(0,8)}.zip!`)
    } catch { toast('Tải thất bại', 'error') }
    setDlBusy('')
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:24, color:'var(--t1)' }}>Quản lý Key</h1>
          <p style={{ color:'var(--t3)', fontSize:13, marginTop:2 }}>Tạo, phân phối và theo dõi license key</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="white" size="sm" onClick={loadKeys}><RefreshCw size={13}/></Btn>
          <Btn onClick={onCreateKey}><span>＋</span> Tạo Key</Btn>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <motion.button key={t.k} whileHover={{scale:1.04}} whileTap={{scale:.96}} onClick={()=>setFilter(t.k)}
            style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--f-sans)', transition:'all .15s', border:'1.5px solid',
              background: filter===t.k ? 'var(--g-brand)' : 'white',
              color:       filter===t.k ? 'white' : 'var(--t3)',
              borderColor: filter===t.k ? 'transparent' : 'var(--b2)',
              boxShadow:   filter===t.k ? 'var(--s-indigo)' : 'var(--s1)',
            }}>
            {t.label} <span style={{ opacity:.75 }}>({t.n})</span>
          </motion.button>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background:'white', border:'1.5px solid var(--b1)', borderRadius:16, overflow:'hidden', boxShadow:'var(--s2)' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1.5px solid var(--b1)', display:'flex', alignItems:'center', gap:10 }}>
          <Search size={14} color="var(--t3)" style={{ flexShrink:0 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm key, email, tên…"
            style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--t1)', fontSize:13, fontFamily:'var(--f-sans)' }}/>
          <span style={{ fontSize:12, color:'var(--t3)' }}>{rows.length} kết quả</span>
        </div>

        {loading ? (
          <div style={{ padding:'48px', textAlign:'center' }}><Spinner size={28}/></div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['License Key','Gói','Người dùng','Modules','Hết hạn','Trạng thái','Hành động'].map(h => (
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.09em', borderBottom:'1.5px solid var(--b1)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rows.map((k,i) => (
                    <motion.tr key={k.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.025}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='white'}
                      style={{ borderBottom:'1px solid var(--b1)', transition:'background .1s' }}>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--indigo-d)', fontWeight:600 }}>{k.key_code?.slice(0,22)}…</div>
                        {k.note && <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{k.note}</div>}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:10, fontWeight:800, background:'var(--indigo-l)', color:'var(--indigo-d)', padding:'2px 8px', borderRadius:6, fontFamily:'var(--f-mono)' }}>{KEY_PLANS[k.plan]?.badge||k.plan}</span>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        {k.email ? <><div style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{k.name||'—'}</div><div style={{ fontSize:11, color:'var(--t3)' }}>{k.email}</div></> : <span style={{ fontSize:12, color:'var(--t3)' }}>Chưa gán</span>}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:12, color:'var(--t1)', fontWeight:600 }}>{keyModuleIds(k).length} module</span>
                        <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>master + sub-keys</div>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontSize:12, color:'var(--t1)' }}>{format(new Date(k.expires_at),'dd/MM/yyyy')}</div>
                        <div style={{ fontSize:10, fontFamily:'var(--f-mono)', fontWeight:700, color:k.daysLeft<=0?'var(--rose)':k.daysLeft<=14?'var(--amber)':'var(--emerald)' }}>
                          {k.daysLeft<=0?'Hết hạn':`+${k.daysLeft}d`}
                        </div>
                      </td>
                      <td style={{ padding:'11px 14px' }}><Tag status={k.status}/></td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          <Btn size="xs" variant="ghost" onClick={()=>setDetail(k)}>Chi tiết</Btn>
                          <Btn size="xs" variant="sky" onClick={()=>download(k)} disabled={dlBusy===k.id}>
                            {dlBusy===k.id ? <Spinner size={11}/> : <Download size={10}/>} ZIP
                          </Btn>
                          {!k.revoked && <Btn size="xs" variant="indigo" onClick={async()=>{ if(await confirm('Thu hồi key này?')){ await revokeKey(k.id); toast('Đã thu hồi key','warn') }}}>Thu hồi</Btn>}
                          <Btn size="xs" variant="danger" onClick={async()=>{ if(await confirm('Xóa hoàn toàn key này?')){ await deleteKey(k.id); toast('Đã xóa key','warn') }}}><Trash2 size={10}/></Btn>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {rows.length===0 && <div style={{ padding:'44px', textAlign:'center', color:'var(--t3)', fontSize:13 }}>Không tìm thấy key nào</div>}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title="Chi tiết License Key" subtitle={detail?.key_code}
        footer={<><Btn variant="ghost" onClick={()=>setDetail(null)}>Đóng</Btn>{detail&&<Btn variant="sky" onClick={()=>download(detail)}><Download size={13}/> Tải ZIP</Btn>}</>}>
        {detail && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--indigo-l)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'var(--indigo)', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>License Key</div>
              <div style={{ fontFamily:'var(--f-mono)', fontSize:12, color:'var(--indigo-d)', fontWeight:600, wordBreak:'break-all', lineHeight:1.7 }}>{detail.key_code}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Gói',KEY_PLANS[detail.plan]?.label],['Trạng thái',<Tag status={detail.status}/>],['Email',detail.email||'Chưa gán'],['Tên',detail.name||'—'],['Ngày tạo',format(new Date(detail.created_at),'dd/MM/yyyy')],['Hết hạn',format(new Date(detail.expires_at),'dd/MM/yyyy')+(detail.daysLeft>0?` (+${detail.daysLeft}d)`:' (hết)')]]
                .map(([l,v])=>(
                <div key={l} style={{ background:'var(--surface2)', borderRadius:9, padding:'10px 12px', border:'1px solid var(--b1)' }}>
                  <div style={{ fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4, fontWeight:700 }}>{l}</div>
                  <div style={{ fontSize:13, color:'var(--t1)', fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, fontWeight:700 }}>Modules (sub-key mỗi module trong ZIP)</div>
              <ModuleChips selected={keyModuleIds(detail)} readOnly />
            </div>
          </div>
        )}
      </Modal>
      <Dialog/>
    </div>
  )
}
