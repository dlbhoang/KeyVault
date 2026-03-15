// ── CreateKeyModal ──────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Package, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { Modal, Btn, Field, Input, Select, ModuleChips, Spinner } from '../components/ui.jsx'
import { useAdminStore, MODULES, KEY_PLANS } from '../store/index.js'
import { adminApi } from '../utils/api.js'

export function CreateKeyModal({ open, onClose, toast }) {
  const createKeys = useAdminStore(s => s.createKeys)
  const [plan, setPlan]         = useState('full6m')
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [count, setCount]       = useState(1)
  const [modules, setModules]   = useState(MODULES.map(m => m.id))
  const [note, setNote]         = useState('')
  const [customDate, setCustomDate] = useState('')
  const [busy, setBusy]         = useState(false)
  const [dlBusy, setDlBusy]     = useState('')
  const [created, setCreated]   = useState([])

  const changePlan = p => {
    setPlan(p)
    if (KEY_PLANS[p]?.allMods) setModules(MODULES.map(m => m.id))
  }

  const handleCreate = async () => {
    if (!modules.length) { toast('Chọn ít nhất 1 module!', 'error'); return }
    setBusy(true)
    try {
      const result = await createKeys({ plan, email, name, modules, note, customDate, count })
      setCreated(result)
      toast(`✨ Đã tạo ${result.length} key thành công!`)
    } catch(e) { toast(e.message, 'error') }
    setBusy(false)
  }

  const downloadZip = async (k) => {
    setDlBusy(k.id)
    const token = localStorage.getItem('kv_token')
    try {
      const res = await fetch(adminApi.downloadZipUrl(k.id), { headers:{ Authorization:`Bearer ${token}` } })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download=`KeyVault-${k.key_code?.slice(0,8)}.zip`; a.click()
      URL.revokeObjectURL(url)
      toast(`📦 Đã tải ${k.key_code?.slice(0,8)}.zip!`)
    } catch { toast('Lỗi tải ZIP', 'error') }
    setDlBusy('')
  }

  const downloadAll = async () => { for(const k of created){ await downloadZip(k); await new Promise(r=>setTimeout(r,350)) } }

  const reset = () => { setPlan('full6m');setEmail('');setName('');setCount(1);setModules(MODULES.map(m=>m.id));setNote('');setCustomDate('');setCreated([]) }

  return (
    <Modal open={open} onClose={()=>{reset();onClose()}} title="🔑 Tạo License Key" subtitle="Tạo key và tải gói cài đặt ZIP" maxW={580}>
      <AnimatePresence mode="wait">
        {created.length===0 ? (
          <motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:15}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 110px',gap:12}}>
              <Field label="Gói license">
                <Select value={plan} onChange={e=>changePlan(e.target.value)}>
                  {Object.entries(KEY_PLANS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </Select>
              </Field>
              <Field label="Số lượng">
                <Input type="number" value={count} min={1} max={50} onChange={e=>setCount(Math.max(1,Math.min(50,+e.target.value)))}/>
              </Field>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Field label="Email người dùng"><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com" type="email"/></Field>
              <Field label="Tên người dùng"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn A"/></Field>
            </div>
            {plan==='custom' && <Field label="Ngày hết hạn"><Input type="date" value={customDate} onChange={e=>setCustomDate(e.target.value)}/></Field>}
            <Field label={`Modules (${modules.length}/${MODULES.length} đã chọn)`}>
              <div style={{background:'var(--surface2)',border:'1.5px solid var(--b1)',borderRadius:10,padding:'14px'}}>
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:10}}>
                  <button onClick={()=>setModules(MODULES.map(m=>m.id))} style={{fontSize:11,background:'var(--indigo-l)',color:'var(--indigo-d)',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontWeight:700}}>Tất cả</button>
                  <button onClick={()=>setModules([])} style={{fontSize:11,background:'var(--surface3)',color:'var(--t3)',border:'1.5px solid var(--b1)',borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>Xóa hết</button>
                </div>
                <ModuleChips selected={modules} onChange={setModules}/>
              </div>
            </Field>
            <Field label="Ghi chú nội bộ"><Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ghi chú cho key này…"/></Field>
            <div style={{background:'var(--sky-l)',border:'1.5px solid rgba(14,165,233,.2)',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--t2)',lineHeight:1.8}}>
              💡 Sau khi tạo, bạn có thể tải gói ZIP gồm <code style={{background:'rgba(14,165,233,.15)',padding:'1px 5px',borderRadius:4,fontFamily:'var(--f-mono)'}}>LICENSE.key</code> + <code style={{background:'rgba(14,165,233,.15)',padding:'1px 5px',borderRadius:4,fontFamily:'var(--f-mono)'}}>Setup.exe</code> để gửi cho người dùng.
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="ghost" onClick={()=>{reset();onClose()}}>Hủy</Btn>
              <Btn onClick={handleCreate} disabled={busy}>{busy?<><Spinner size={15} color="#fff"/>Đang tạo…</>:<><Sparkles size={14}/>Tạo {count>1?`${count} Key`:'Key'}</>}</Btn>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{textAlign:'center',padding:'8px 0 14px'}}>
              <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',damping:12}} style={{fontSize:52,marginBottom:10}}>🎉</motion.div>
              <div style={{fontWeight:800,fontSize:20,color:'var(--t1)'}}>Tạo key thành công!</div>
              <div style={{color:'var(--t3)',fontSize:13,marginTop:4}}>Tải gói ZIP để gửi cho người dùng</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:300,overflowY:'auto'}}>
              {created.map((k,i)=>(
                <motion.div key={k.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
                  style={{background:'var(--surface2)',border:'1.5px solid var(--b1)',borderRadius:12,padding:'13px 15px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--indigo-d)',fontWeight:600,wordBreak:'break-all'}}>{k.key_code}</div>
                    <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{KEY_PLANS[k.plan]?.label} · {k.modules?.length} modules{k.email?` · ${k.email}`:''}</div>
                  </div>
                  <Btn size="sm" variant="sky" onClick={()=>downloadZip(k)} disabled={dlBusy===k.id}>
                    {dlBusy===k.id?<Spinner size={13}/>:<Download size={12}/>} ZIP
                  </Btn>
                </motion.div>
              ))}
            </div>
            {created.length>1 && <Btn onClick={downloadAll} full><Package size={14}/>Tải tất cả {created.length} gói ZIP</Btn>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={reset}><Sparkles size={13}/>Tạo key mới</Btn>
              <Btn variant="white" onClick={()=>{reset();onClose()}}>Đóng</Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

// ── LOGS PAGE ───────────────────────────────────────────────────────────────
import { format as dateFmt } from 'date-fns'
import { Trash2 } from 'lucide-react'

export function LogsPage({ toast }) {
  const { logs, loadLogs, clearLogs } = useAdminStore()
  React.useEffect(()=>{ loadLogs() },[])
  const DC = { success:'var(--emerald)', warn:'var(--amber)', danger:'var(--rose)', info:'var(--indigo)' }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
        <div><h1 style={{fontWeight:800,fontSize:24,color:'var(--t1)'}}>Activity Log</h1><p style={{color:'var(--t3)',fontSize:13,marginTop:2}}>{logs.length} sự kiện ghi lại</p></div>
        <Btn variant="danger" size="sm" onClick={async()=>{await clearLogs();toast('Đã xóa log','warn')}}><Trash2 size={13}/>Xóa tất cả</Btn>
      </div>
      <div style={{background:'white',border:'1.5px solid var(--b1)',borderRadius:16,overflow:'hidden',boxShadow:'var(--s2)',padding:'0 20px'}}>
        {logs.length===0 ? <div style={{padding:'52px',textAlign:'center',color:'var(--t3)',fontSize:13}}>Chưa có log nào</div>
        : logs.map((l,i)=>(
          <div key={l.id} style={{display:'flex',alignItems:'flex-start',gap:13,padding:'13px 0',borderBottom:i<logs.length-1?'1px solid var(--b1)':'none'}}>
            <div style={{width:8,height:8,borderRadius:4,background:DC[l.type]||'var(--indigo)',marginTop:5,flexShrink:0,boxShadow:`0 0 6px ${DC[l.type]||'var(--indigo)'}55`}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:'var(--t1)'}}>{l.message}</div>
              <div style={{fontSize:10,color:'var(--t3)',marginTop:2,fontFamily:'var(--f-mono)'}}>{dateFmt(new Date(l.created_at),'dd/MM/yyyy HH:mm:ss')}</div>
            </div>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:`${DC[l.type]||'var(--indigo)'}14`,color:DC[l.type]||'var(--indigo)',flexShrink:0,fontFamily:'var(--f-mono)'}}>{l.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
