const { addDays, format, formatISO } = require('date-fns')
const JSZip = require('jszip')
const { v4: uuidv4 } = require('uuid')

const MODULES = [
  { id:'analytics', name:'Analytics',  icon:'📊', color:'#6366f1' },
  { id:'reports',   name:'Reports',    icon:'📄', color:'#0ea5e9' },
  { id:'crm',       name:'CRM',        icon:'🤝', color:'#10b981' },
  { id:'inventory', name:'Inventory',  icon:'📦', color:'#f59e0b' },
  { id:'hr',        name:'HR Manager', icon:'👔', color:'#ec4899' },
  { id:'finance',   name:'Finance',    icon:'💰', color:'#ef4444' },
  { id:'ai',        name:'AI Tools',   icon:'🤖', color:'#8b5cf6' },
  { id:'api',       name:'API Access', icon:'🔌', color:'#14b8a6' },
]

const KEY_PLANS = {
  full6m:    { label:'Full Access · 6 tháng', days:182, allMods:true  },
  full1y:    { label:'Full Access · 1 năm',   days:365, allMods:true  },
  desktop1y: { label:'Desktop App · 1 năm',   days:365, allMods:false },
  custom:    { label:'Tùy chỉnh',              days:null,allMods:false },
}

const genKeyCode = () => {
  const s = () => Math.random().toString(36).slice(2,8).toUpperCase()
  return `KV-${s()}-${s()}-${s()}-${s()}`
}
const genId   = () => uuidv4()
const daysLeft = (exp) => Math.ceil((new Date(exp)-new Date())/86400000)

function calcExpiry(plan, customDate) {
  if (plan==='custom' && customDate) return new Date(customDate).toISOString()
  const d = KEY_PLANS[plan]?.days || 365
  return formatISO(addDays(new Date(), d))
}

function keyStatus(k) {
  if (k.revoked)   return 'revoked'
  if (!k.activated) return 'pending'
  if (daysLeft(k.expires_at) <= 0) return 'expired'
  if (k.plan==='full6m') return 'trial'
  return 'active'
}

async function buildZip(k) {
  const mods = k.modules || []
  const plan = KEY_PLANS[k.plan]
  const dl   = daysLeft(k.expires_at)
  const modNames = mods.map(id => { const m=MODULES.find(x=>x.id===id); return `  ${m?.icon||'•'}  ${m?.name||id}` }).join('\n')

  const zip = new JSZip()
  const folder = zip.folder(`KeyVault-${k.key_code.slice(0,8)}`)
  folder.file('LICENSE.key', [
    `# KeyVault License File — ${format(new Date(),'yyyy-MM-dd')}`,``,
    `[LICENSE]`,`Key = ${k.key_code}`,`Plan = ${plan?.label||k.plan}`,
    `Email = ${k.email||''}`,`Name = ${k.name||''}`,
    `Expires = ${format(new Date(k.expires_at),'dd/MM/yyyy')} (${dl} ngày còn)`,``,
    `[MODULES]`,...mods.map(id=>`${id} = ${MODULES.find(x=>x.id===id)?.name||id}`),
    ``,`[CHECKSUM]`,`Hash = ${Buffer.from(k.key_code+k.expires_at).toString('base64').slice(0,32)}`,
  ].join('\n'))
  folder.file('README.txt', `KeyVault Setup\n\nKey: ${k.key_code}\nPlan: ${plan?.label}\nHết hạn: ${format(new Date(k.expires_at),'dd/MM/yyyy')}\n\nModules:\n${modNames}\n\n1. Chạy KeyVault-Setup.exe\n2. Nhập license key trên\n3. Kích hoạt\n\nSupport: support@keyvault.app`)
  folder.file('KeyVault-Setup.exe', `MZ KeyVault Desktop Installer\nKey: ${k.key_code}\n[STUB - replace with real binary]`)
  folder.file('config.json', JSON.stringify({ version:'2.1.0', key:k.key_code, plan:k.plan, modules:mods, expiresAt:k.expires_at },null,2))
  return zip.generateAsync({ type:'nodebuffer', compression:'DEFLATE', compressionOptions:{ level:6 } })
}

module.exports = { MODULES, KEY_PLANS, genKeyCode, genId, calcExpiry, keyStatus, daysLeft, buildZip }
